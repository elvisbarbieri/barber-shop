# How main.bicep Works - Step by Step Explanation

This document explains how the `main.bicep` file orchestrates the deployment of all Azure resources.

## Overview

`main.bicep` is the **orchestrator** template that:
1. Defines parameters and variables
2. Calls module templates to create resources
3. Manages dependencies between resources
4. Outputs important values after deployment

---

## Step-by-Step Breakdown

### **Step 1: Template Scope Declaration**

```bicep
targetScope = 'resourceGroup'
```

**What it does:**
- Declares this template deploys resources to a **Resource Group**
- The resource group must exist before deployment

---

### **Step 2: Parameters Definition**

```bicep
param location string = resourceGroup().location
param projectName string = 'barberdist'
param environment string = 'dev'
```

**What it does:**
- **`location`**: Azure region (defaults to resource group's location)
- **`projectName`**: Base name for all resources (`barberdist`)
- **`environment`**: Environment identifier (`dev`, `prod`, etc.)

**Example values:**
- `location` = `eastus`
- `projectName` = `barberdist`
- `environment` = `dev`

---

### **Step 3: Variables Definition**

```bicep
var functionAppName = '${projectName}-func-${environment}'
var storageAccountName = '${replace(projectName, '-', '')}st${uniqueString(resourceGroup().id)}'
var appServicePlanName = '${projectName}-plan-${environment}'
var apimServiceName = '${projectName}-apim-${environment}'
var apimBaseUrl = projectName
```

**What it does:**
Creates consistent naming for all resources:

| Variable | Generated Name | Example |
|----------|---------------|---------|
| `functionAppName` | `barberdist-func-dev` | Function App name |
| `storageAccountName` | `barberdistst` + unique string | Storage account (must be globally unique) |
| `appServicePlanName` | `barberdist-plan-dev` | App Service Plan name |
| `apimServiceName` | `barberdist-apim-dev` | API Management service name |
| `apimBaseUrl` | `barberdist` | Base URL for API (`barberdist.azure-api.net`) |

**Key points:**
- Storage account name removes dashes and adds unique string (Azure requirement)
- All names follow pattern: `{project}-{type}-{environment}`

---

### **Step 4: Module 1 - Storage Account**

```bicep
module storageAccount './modules/storageAccount.bicep' = {
  name: 'storageAccount'
  params: {
    name: storageAccountName
    location: location
  }
}
```

**What it does:**
- Calls `storageAccount.bicep` module
- Creates an Azure Storage Account
- **Why needed:** Azure Functions requires storage for:
  - Function code and configuration
  - Runtime state
  - Logs and triggers

**Creates:**
- Storage Account with:
  - Standard LRS (Locally Redundant Storage)
  - HTTPS only
  - TLS 1.2 minimum

**Dependencies:** None (created first)

---

### **Step 5: Module 2 - App Service Plan**

```bicep
module appServicePlan './modules/appServicePlan.bicep' = {
  name: 'appServicePlan'
  params: {
    name: appServicePlanName
    location: location
  }
}
```

**What it does:**
- Calls `appServicePlan.bicep` module
- Creates an App Service Plan (Consumption plan)
- **Why needed:** Defines the compute resources for Azure Functions

**Creates:**
- App Service Plan with:
  - SKU: `Y1` (Consumption plan)
  - Tier: `Dynamic` (pay-per-use)
  - Reserved: `true` (for Linux)

**Dependencies:** None (can be created in parallel with storage)

---

### **Step 6: Module 3 - Function App**

```bicep
module functionApp './modules/functionApp.bicep' = {
  name: 'functionApp'
  params: {
    name: functionAppName
    location: location
    storageAccountName: storageAccountName
    appServicePlanId: appServicePlan.outputs.appServicePlanId
  }
  dependsOn: [
    storageAccount
  ]
}
```

**What it does:**
- Calls `functionApp.bicep` module
- Creates the Azure Function App (where your Node.js code runs)
- **Why needed:** Hosts your API endpoints

**Creates:**
- Function App with:
  - Node.js 18 runtime
  - Functions v4 extension
  - Linux container
  - HTTPS only
  - Connected to storage account and app service plan

**Dependencies:**
- ✅ **Storage Account** (must exist first - `dependsOn`)
- ✅ **App Service Plan** (uses `appServicePlan.outputs.appServicePlanId`)

**Outputs:**
- `functionAppName`: `barberdist-func-dev`
- `functionAppResourceId`: Resource ID for APIM backend
- `functionAppHostName`: `barberdist-func-dev.azurewebsites.net`
- `functionAppUrl`: `https://barberdist-func-dev.azurewebsites.net`

---

### **Step 7: Module 4 - API Management Service**

```bicep
module apiManagement './modules/apiManagement.bicep' = {
  name: 'apiManagement'
  params: {
    name: apimServiceName
    location: location
    baseUrl: apimBaseUrl
  }
}
```

**What it does:**
- Calls `apiManagement.bicep` module
- Creates Azure API Management service
- **Why needed:** Provides API gateway, base URL, and API management features

**Creates:**
- APIM Service with:
  - SKU: `Consumption` (pay-per-use)
  - Custom domain: `barberdist.azure-api.net`
  - Security settings (disables old TLS/SSL protocols)
  - System-assigned managed identity

**Dependencies:** None (can be created in parallel)

**Outputs:**
- `apimServiceName`: `barberdist-apim-dev`
- `apimServiceId`: Resource ID
- `gatewayUrl`: `https://barberdist.azure-api.net`
- `portalUrl`: Developer portal URL

**⏱️ Takes 30-45 minutes to create** (longest step)

---

### **Step 8: Module 5 - APIM Backend**

```bicep
module apimBackend './modules/apimBackend.bicep' = {
  name: 'apimBackend'
  params: {
    apimServiceName: apimServiceName
    functionAppResourceId: functionApp.outputs.functionAppResourceId
    functionAppHostName: functionApp.outputs.functionAppHostName
    backendId: 'barberdist-backend'
  }
  dependsOn: [
    functionApp
    apiManagement
  ]
}
```

**What it does:**
- Calls `apimBackend.bicep` module
- Creates a backend configuration in APIM
- **Why needed:** Tells APIM where to route requests (to your Function App)

**Creates:**
- Backend resource with:
  - Name: `barberdist-backend`
  - URL: `https://barberdist-func-dev.azurewebsites.net`
  - Protocol: HTTP
  - TLS validation enabled

**Dependencies:**
- ✅ **Function App** (needs `functionApp.outputs`)
- ✅ **APIM Service** (must exist first)

**Think of it as:** APIM's "phone book" entry pointing to your Function App

---

### **Step 9: Module 6 - APIM APIs**

```bicep
module apimApis './modules/apimApis.bicep' = {
  name: 'apimApis'
  params: {
    apimServiceName: apimServiceName
    backendId: 'barberdist-backend'
    serviceUrl: functionApp.outputs.functionAppUrl
  }
  dependsOn: [
    apimBackend
    functionApp
  ]
}
```

**What it does:**
- Calls `apimApis.bicep` module
- Creates the API definition in APIM
- **Why needed:** Defines the API structure, path, and routing rules

**Creates:**
- API Definition with:
  - Name: `barberdist-api`
  - Display Name: `Distrito Barbearia API`
  - Path: `barberdist` (so URL is `/barberdist/api/...`)
  - Version: `v1`
  - Service URL: Points to Function App
- API Version Set (for versioning)
- API Policy (routes requests to backend and rewrites URLs)

**Dependencies:**
- ✅ **APIM Backend** (needs backend to exist)
- ✅ **Function App** (needs URL)

**API Policy Explanation:**
```xml
<set-backend-service backend-id="barberdist-backend" />
```
→ Routes request to Function App

```xml
<rewrite-uri template="/api" />
```
→ Rewrites `/barberdist/api/barbers` → `/api/barbers` (Function App format)

---

### **Step 10: Outputs**

```bicep
output functionAppName string = functionApp.outputs.functionAppName
output functionAppUrl string = functionApp.outputs.functionAppUrl
output apimServiceName string = apiManagement.outputs.apimServiceName
output apimGatewayUrl string = apiManagement.outputs.gatewayUrl
output apimPortalUrl string = apiManagement.outputs.portalUrl
output apimBaseUrl string = apimBaseUrl
```

**What it does:**
- Exposes important values after deployment
- **Why needed:** You need these values for:
  - Deploying code to Function App
  - Testing the API
  - Configuring other services

**Example outputs:**
```json
{
  "functionAppName": {
    "value": "barberdist-func-dev"
  },
  "functionAppUrl": {
    "value": "https://barberdist-func-dev.azurewebsites.net"
  },
  "apimGatewayUrl": {
    "value": "https://barberdist.azure-api.net"
  },
  "apimBaseUrl": {
    "value": "barberdist"
  }
}
```

---

## Deployment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    main.bicep Starts                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                      ┌───────────────┐
│ Storage       │                      │ App Service   │
│ Account       │                      │ Plan          │
│ (Module 1)    │                      │ (Module 2)    │
└───────┬───────┘                      └───────┬───────┘
        │                                       │
        └───────────┬───────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Function App  │
            │ (Module 3)    │
            └───────┬───────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│ API Management│      │ APIM Backend  │
│ (Module 4)    │      │ (Module 5)    │
└───────┬───────┘      └───────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            ┌───────────────┐
            │ APIM APIs     │
            │ (Module 6)    │
            └───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Outputs     │
            └───────────────┘
```

## Dependency Chain

1. **Parallel (no dependencies):**
   - Storage Account
   - App Service Plan
   - API Management Service

2. **Depends on Storage + Plan:**
   - Function App

3. **Depends on Function App + APIM:**
   - APIM Backend

4. **Depends on Backend + Function App:**
   - APIM APIs

## Key Concepts

### **Modules**
- Reusable Bicep templates
- Each module creates one or more resources
- Can have inputs (params) and outputs

### **Dependencies (`dependsOn`)**
- Ensures resources are created in the correct order
- Azure automatically waits for dependencies before proceeding

### **Outputs**
- Values returned from modules
- Can be used by other modules or exposed as final outputs

### **Variables**
- Computed values based on parameters
- Ensures consistent naming across resources

## Real-World Example

When you run:
```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json
```

**What happens:**

1. ✅ Azure reads `main.bicep`
2. ✅ Creates Storage Account (`barberdistst...`)
3. ✅ Creates App Service Plan (`barberdist-plan-dev`)
4. ✅ Creates APIM Service (`barberdist-apim-dev`) - **takes 30-45 min**
5. ✅ Waits for Storage + Plan, then creates Function App (`barberdist-func-dev`)
6. ✅ Waits for Function App + APIM, then creates APIM Backend
7. ✅ Waits for Backend, then creates APIM APIs
8. ✅ Returns outputs with all important URLs and names

**Total time:** ~45-60 minutes (mostly APIM creation)

## Summary

`main.bicep` is like a **recipe** that:
- Defines what resources to create
- Specifies the order (dependencies)
- Connects resources together (outputs → inputs)
- Returns important values when done

Each module is like a **sub-recipe** that creates specific Azure resources, and `main.bicep` orchestrates them all together.

