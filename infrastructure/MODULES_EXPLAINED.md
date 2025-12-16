# Bicep Modules Explained - Step by Step

This document explains each Bicep module file in detail, line by line.

---

## 1. storageAccount.bicep

**Purpose:** Creates an Azure Storage Account required by Azure Functions.

### Step-by-Step Breakdown

#### **Lines 1-2: Parameters**
```bicep
param name string
param location string
```

**What it does:**
- **`name`**: Storage account name (must be globally unique, 3-24 chars, lowercase)
- **`location`**: Azure region where storage will be created

**Example values:**
- `name` = `barberdiststabc123xyz`
- `location` = `eastus`

---

#### **Lines 4-15: Storage Account Resource**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}
```

**Line-by-line explanation:**

- **`name: name`**: Sets the storage account name from parameter
- **`location: location`**: Sets the Azure region
- **`kind: 'StorageV2'`**: 
  - Uses StorageV2 (general-purpose v2)
  - Supports all storage types (blobs, files, queues, tables)
  - Required for Azure Functions

- **`sku.name: 'Standard_LRS'`**:
  - **Standard**: Standard performance tier
  - **LRS**: Locally Redundant Storage
  - Data replicated 3 times within the same datacenter
  - Cheapest option, good for development

- **`supportsHttpsTrafficOnly: true`**:
  - Forces HTTPS for all connections
  - Security best practice
  - Blocks HTTP access

- **`minimumTlsVersion: 'TLS1_2'`**:
  - Requires TLS 1.2 or higher
  - Blocks older, insecure TLS versions
  - Security compliance requirement

- **`allowBlobPublicAccess: false`**:
  - Prevents public access to blobs
  - Security best practice
  - Blobs can only be accessed with authentication

---

#### **Lines 18-20: Outputs**
```bicep
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output storageAccountPrimaryEndpoints object = storageAccount.properties.primaryEndpoints
```

**What it does:**
- Exposes storage account name, ID, and endpoints
- Used by other modules (especially Function App)

**Example outputs:**
- `storageAccountName`: `barberdiststabc123xyz`
- `storageAccountId`: `/subscriptions/.../storageAccounts/barberdiststabc123xyz`
- `storageAccountPrimaryEndpoints`: Object with blob, file, queue, table URLs

---

## 2. appServicePlan.bicep

**Purpose:** Creates an App Service Plan that defines compute resources for Azure Functions.

### Step-by-Step Breakdown

#### **Lines 1-4: Parameters**
```bicep
param name string
param location string
param sku string = 'Y1'
param tier string = 'Dynamic'
```

**What it does:**
- **`name`**: App Service Plan name
- **`location`**: Azure region
- **`sku`**: SKU name (default `Y1` = Consumption plan)
- **`tier`**: Pricing tier (default `Dynamic` = Consumption)

**SKU Options:**
- `Y1`: Consumption plan (pay-per-use)
- `EP1`, `EP2`, `EP3`: Premium plans (dedicated VMs)

---

#### **Lines 6-16: App Service Plan Resource**
```bicep
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: name
  location: location
  kind: 'functionapp'
  sku: {
    name: sku
    tier: tier
  }
  properties: {
    reserved: true
  }
}
```

**Line-by-line explanation:**

- **`kind: 'functionapp'`**:
  - Specifies this plan is for Azure Functions
  - Different from regular App Service plans

- **`sku.name: sku`** and **`sku.tier: tier`**:
  - **Consumption Plan (`Y1` + `Dynamic`)**:
    - Scales automatically (0 to 200 instances)
    - Pay only for execution time
    - Free tier: 1M requests/month
    - Best for: Variable workloads, cost optimization

- **`properties.reserved: true`**:
  - Required for Linux Function Apps
  - Reserves the plan for Linux containers
  - Cannot run Windows apps on this plan

---

#### **Lines 19-20: Outputs**
```bicep
output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
```

**What it does:**
- Exposes plan ID and name
- Function App needs the ID to reference this plan

**Example outputs:**
- `appServicePlanId`: `/subscriptions/.../serverfarms/barberdist-plan-dev`
- `appServicePlanName`: `barberdist-plan-dev`

---

## 3. functionApp.bicep

**Purpose:** Creates the Azure Function App that hosts your Node.js API code.

### Step-by-Step Breakdown

#### **Lines 1-4: Parameters**
```bicep
param name string
param location string
param storageAccountName string
param appServicePlanId string
```

**What it does:**
- **`name`**: Function App name (e.g., `barberdist-func-dev`)
- **`location`**: Azure region
- **`storageAccountName`**: Name of existing storage account
- **`appServicePlanId`**: ID of existing App Service Plan

---

#### **Lines 6-7: Variables**
```bicep
var functionAppVersion = '~4'
var nodeVersion = '18'
```

**What it does:**
- **`functionAppVersion`**: Azure Functions runtime version (`~4` = latest v4)
- **`nodeVersion`**: Node.js version (`18` = Node.js 18 LTS)

---

#### **Lines 9-11: Reference Existing Storage**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}
```

**What it does:**
- References the storage account created earlier
- Uses `existing` keyword (doesn't create, just references)
- Allows accessing storage account properties

---

#### **Lines 13-55: Function App Resource**
```bicep
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlanId
    reserved: true
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      appSettings: [...]
    }
  }
}
```

**Line-by-line explanation:**

- **`kind: 'functionapp,linux'`**:
  - Creates a Function App
  - Uses Linux containers (not Windows)

- **`serverFarmId: appServicePlanId`**:
  - Links Function App to the App Service Plan
  - Defines compute resources

- **`reserved: true`**:
  - Required for Linux Function Apps
  - Must match App Service Plan `reserved: true`

- **`httpsOnly: true`**:
  - Forces HTTPS for all requests
  - Blocks HTTP access
  - Security best practice

- **`clientAffinityEnabled: false`**:
  - Disables session affinity (sticky sessions)
  - Functions are stateless, so this is correct
  - Allows load balancing across instances

- **`linuxFxVersion: 'NODE|${nodeVersion}'`**:
  - Sets runtime stack to Node.js
  - Version: `NODE|18` = Node.js 18

---

#### **Lines 24-53: App Settings (Environment Variables)**

**Setting 1: AzureWebJobsStorage**
```bicep
name: 'AzureWebJobsStorage'
value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
```

**What it does:**
- **Required** connection string for Functions runtime
- Used for:
  - Triggers (HTTP, Timer, Queue, etc.)
  - Logging
  - Runtime state
- **`listKeys()`**: Dynamically retrieves storage account key
- **`az.environment().suffixes.storage`**: Gets Azure environment suffix (e.g., `core.windows.net`)

**Setting 2: WEBSITE_CONTENTAZUREFILECONNECTIONSTRING**
```bicep
name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
```

**What it does:**
- Connection string for Function App content storage
- Stores function code and configuration
- Same connection string format as above

**Setting 3: WEBSITE_CONTENTSHARE**
```bicep
name: 'WEBSITE_CONTENTSHARE'
value: toLower(name)
```

**What it does:**
- Name of the file share in storage account
- Stores Function App files
- Must be lowercase (Azure requirement)
- Example: `barberdist-func-dev`

**Setting 4: FUNCTIONS_EXTENSION_VERSION**
```bicep
name: 'FUNCTIONS_EXTENSION_VERSION'
value: functionAppVersion
```

**What it does:**
- Azure Functions runtime version
- `~4` = latest v4.x version
- v4 supports Node.js 18+

**Setting 5: FUNCTIONS_WORKER_RUNTIME**
```bicep
name: 'FUNCTIONS_WORKER_RUNTIME'
value: 'node'
```

**What it does:**
- Specifies programming language runtime
- `node` = Node.js
- Other options: `python`, `java`, `dotnet`, `powershell`

**Setting 6: WEBSITE_NODE_DEFAULT_VERSION**
```bicep
name: 'WEBSITE_NODE_DEFAULT_VERSION'
value: '~${nodeVersion}'
```

**What it does:**
- Node.js version for the Function App
- `~18` = latest Node.js 18.x
- Must match `nodeVersion` variable

**Setting 7: APPINSIGHTS_INSTRUMENTATIONKEY**
```bicep
name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
value: ''
```

**What it does:**
- Application Insights key (optional)
- Currently empty (not configured)
- Can be added later for monitoring

---

#### **Lines 58-61: Outputs**
```bicep
output functionAppName string = functionApp.name
output functionAppResourceId string = functionApp.id
output functionAppHostName string = functionApp.properties.defaultHostName
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
```

**What it does:**
- Exposes Function App details needed by APIM

**Example outputs:**
- `functionAppName`: `barberdist-func-dev`
- `functionAppResourceId`: `/subscriptions/.../sites/barberdist-func-dev`
- `functionAppHostName`: `barberdist-func-dev.azurewebsites.net`
- `functionAppUrl`: `https://barberdist-func-dev.azurewebsites.net`

---

## 4. apiManagement.bicep

**Purpose:** Creates Azure API Management service and configures the base URL.

### Step-by-Step Breakdown

#### **Lines 1-7: Parameters**
```bicep
param name string
param location string
param baseUrl string
param publisherName string = 'Distrito Barbearia'
param publisherEmail string = 'admin@distritobarbearia.com'
param sku string = 'Consumption'
param skuCount int = 0
```

**What it does:**
- **`name`**: APIM service name
- **`location`**: Azure region
- **`baseUrl`**: Base URL prefix (e.g., `barberdist` → `barberdist.azure-api.net`)
- **`publisherName`**: Organization name (shown in developer portal)
- **`publisherEmail`**: Admin email for notifications
- **`sku`**: Pricing tier (`Consumption` = pay-per-use)
- **`skuCount`**: Instance count (0 for Consumption = auto-scale)

---

#### **Lines 9-34: APIM Service Resource**
```bicep
resource apiManagementService 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: name
  location: location
  sku: {
    name: sku
    capacity: skuCount
  }
  properties: {
    publisherName: publisherName
    publisherEmail: publisherEmail
    notificationSenderEmail: publisherEmail
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Protocols.Server.Http2': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Ciphers.TripleDes168': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}
```

**Line-by-line explanation:**

- **`sku.name: sku`** and **`sku.capacity: skuCount`**:
  - **Consumption Plan**:
    - Pay per API call
    - Auto-scales (0 to unlimited instances)
    - Free tier: 1M calls/month
    - No upfront costs
    - Best for: Variable traffic, cost optimization

- **`publisherName`** and **`publisherEmail`**:
  - Shown in developer portal
  - Used for email notifications
  - Can be changed later

- **`customProperties`** (Security Settings):
  - **Disables HTTP/2**: `Http2: 'false'`
  - **Disables old SSL/TLS**: `Ssl30`, `Tls10`, `Tls11: 'false'`
  - **Disables weak ciphers**: `TripleDes168: 'false'`
  - **Security best practice**: Only allows TLS 1.2+

- **`identity.type: 'SystemAssigned'`**:
  - Creates managed identity for APIM
  - Allows APIM to authenticate to other Azure services
  - Useful for backend authentication

---

#### **Lines 36-46: Custom Domain Resource**
```bicep
resource apimCustomDomain 'Microsoft.ApiManagement/service/customDomains@2023-05-01-preview' = if (baseUrl != '') {
  parent: apiManagementService
  name: 'default'
  properties: {
    gatewayDomains: [
      {
        domainName: '${baseUrl}.azure-api.net'
      }
    ]
  }
}
```

**What it does:**
- **Conditional creation**: Only if `baseUrl` is not empty
- **Sets base URL**: `barberdist` → `barberdist.azure-api.net`
- **Gateway domain**: Used for API gateway endpoint

**Example:**
- If `baseUrl = 'barberdist'`
- Creates domain: `barberdist.azure-api.net`
- API accessible at: `https://barberdist.azure-api.net/...`

**Note:** `.azure-api.net` domains are automatically managed by Azure (no certificate needed)

---

#### **Lines 48-52: Outputs**
```bicep
output apimServiceName string = apiManagementService.name
output apimServiceId string = apiManagementService.id
output gatewayUrl string = 'https://${apiManagementService.properties.gatewayUrl}'
output portalUrl string = 'https://${apiManagementService.properties.portalUrl}'
output managementApiUrl string = apiManagementService.properties.managementApiUrl
```

**What it does:**
- Exposes APIM service details

**Example outputs:**
- `apimServiceName`: `barberdist-apim-dev`
- `apimServiceId`: `/subscriptions/.../services/barberdist-apim-dev`
- `gatewayUrl`: `https://barberdist.azure-api.net`
- `portalUrl`: `https://barberdist-apim-dev.developer.azure-api.net`
- `managementApiUrl`: Management API endpoint

---

## 5. apimBackend.bicep

**Purpose:** Creates a backend configuration in APIM that points to the Function App.

### Step-by-Step Breakdown

#### **Lines 1-4: Parameters**
```bicep
param apimServiceName string
param functionAppResourceId string
param functionAppHostName string
param backendId string
```

**What it does:**
- **`apimServiceName`**: Name of existing APIM service
- **`functionAppResourceId`**: Resource ID of Function App
- **`functionAppHostName`**: Hostname of Function App (e.g., `barberdist-func-dev.azurewebsites.net`)
- **`backendId`**: Name for this backend (e.g., `barberdist-backend`)

---

#### **Lines 6-8: Reference Existing APIM**
```bicep
resource apimService 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimServiceName
}
```

**What it does:**
- References the APIM service created earlier
- Uses `existing` keyword (doesn't create, just references)
- Allows creating child resources (backends) under APIM

---

#### **Lines 10-28: Backend Resource**
```bicep
resource backend 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apimService
  name: backendId
  properties: {
    description: 'Backend for Barber Distrito Functions'
    url: 'https://${functionAppHostName}'
    protocol: 'http'
    resourceId: functionAppResourceId
    credentials: {
      certificate: []
      query: {}
      header: {}
    }
    tls: {
      validateCertificateChain: true
      validateCertificateName: true
    }
  }
}
```

**Line-by-line explanation:**

- **`parent: apimService`**:
  - Creates backend as child of APIM service
  - Backend belongs to this APIM instance

- **`name: backendId`**:
  - Backend name (e.g., `barberdist-backend`)
  - Used in API policies to reference this backend

- **`description`**:
  - Human-readable description
  - Shown in Azure Portal

- **`url: 'https://${functionAppHostName}'`**:
  - **Backend URL**: Points to Function App
  - Example: `https://barberdist-func-dev.azurewebsites.net`
  - APIM forwards requests to this URL

- **`protocol: 'http'`**:
  - Protocol for backend communication
  - `http` = HTTP/HTTPS (APIM handles HTTPS)
  - Other options: `soap`, `http-ws`

- **`resourceId: functionAppResourceId`**:
  - Azure Resource Manager ID of Function App
  - Used for:
    - Resource discovery
    - Managed identity authentication (if configured)
    - Resource linking

- **`credentials`**:
  - **`certificate: []`**: No client certificates
  - **`query: {}`**: No query string authentication
  - **`header: {}`**: No header authentication
  - Can be configured later if backend requires auth

- **`tls.validateCertificateChain: true`**:
  - Validates SSL certificate chain
  - Security: Ensures certificate is valid

- **`tls.validateCertificateName: true`**:
  - Validates certificate matches hostname
  - Security: Prevents certificate mismatch attacks

---

#### **Lines 30-31: Outputs**
```bicep
output backendId string = backend.name
output backendUrl string = backend.properties.url
```

**What it does:**
- Exposes backend details

**Example outputs:**
- `backendId`: `barberdist-backend`
- `backendUrl`: `https://barberdist-func-dev.azurewebsites.net`

---

## 6. apimApis.bicep

**Purpose:** Creates the API definition, version set, and routing policies in APIM.

### Step-by-Step Breakdown

#### **Lines 1-3: Parameters**
```bicep
param apimServiceName string
param backendId string
param serviceUrl string
```

**What it does:**
- **`apimServiceName`**: Name of existing APIM service
- **`backendId`**: Name of backend (created in `apimBackend.bicep`)
- **`serviceUrl`**: Function App URL (e.g., `https://barberdist-func-dev.azurewebsites.net`)

---

#### **Lines 5-10: Variables**
```bicep
var apiName = 'barberdist-api'
var apiDisplayName = 'Distrito Barbearia API'
var apiDescription = 'RESTful API for managing barbers, services, appointments, and sending confirmation emails'
var apiPath = 'barberdist'
var apiVersion = 'v1'
var apiVersionSetId = 'barberdist-versions'
```

**What it does:**
- Defines API metadata and configuration
- **`apiPath`**: URL path segment (e.g., `/barberdist/api/...`)
- **`apiVersion`**: API version (`v1`)

---

#### **Lines 12-14: Reference Existing APIM**
```bicep
resource apimService 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimServiceName
}
```

**What it does:**
- References existing APIM service
- Allows creating API resources under APIM

---

#### **Lines 16-24: API Version Set**
```bicep
resource apiVersionSet 'Microsoft.ApiManagement/service/apiVersionSets@2023-05-01-preview' = {
  parent: apimService
  name: apiVersionSetId
  properties: {
    displayName: apiDisplayName
    versioningScheme: 'Segment'
    description: 'Version set for ${apiDisplayName}'
  }
}
```

**What it does:**
- Creates a version set for API versioning
- **`versioningScheme: 'Segment'`**: Version in URL path (e.g., `/v1/...`)
- Allows multiple API versions (v1, v2, etc.)

---

#### **Lines 26-45: API Resource**
```bicep
resource api 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apimService
  name: apiName
  properties: {
    displayName: apiDisplayName
    description: apiDescription
    serviceUrl: serviceUrl
    path: apiPath
    protocols: ['https']
    subscriptionRequired: false
    apiVersion: apiVersion
    apiVersionSetId: resourceId(...)
    subscriptionKeyParameterNames: {
      header: 'Ocp-Apim-Subscription-Key'
      query: 'subscription-key'
    }
  }
}
```

**Line-by-line explanation:**

- **`displayName`**: Human-readable name (shown in portal)
- **`description`**: API description
- **`serviceUrl`**: Backend service URL (Function App)
- **`path: apiPath`**: API path segment (`barberdist`)
  - Full URL: `https://barberdist.azure-api.net/barberdist/...`

- **`protocols: ['https']`**:
  - Only HTTPS allowed
  - Blocks HTTP

- **`subscriptionRequired: false`**:
  - No subscription key required
  - Public API (can be changed to `true` for authentication)

- **`apiVersion: apiVersion`**:
  - Sets API version (`v1`)
  - Links to version set

- **`apiVersionSetId`**:
  - Links API to version set
  - Enables versioning support

- **`subscriptionKeyParameterNames`**:
  - **`header`**: `Ocp-Apim-Subscription-Key` (if subscription required)
  - **`query`**: `subscription-key` (alternative query param)
  - Used for API key authentication

---

#### **Lines 47-53: API Backend Link**
```bicep
resource apiBackend 'Microsoft.ApiManagement/service/apis/backends@2023-05-01-preview' = {
  parent: api
  name: backendId
  properties: {
    backendId: '/backends/${backendId}'
  }
}
```

**What it does:**
- Links API to backend
- **`backendId`**: References backend created in `apimBackend.bicep`
- Tells APIM which backend to use for this API

---

#### **Lines 55-79: API Policy**
```bicep
resource apiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: api
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <base />
          <set-backend-service backend-id="${backendId}" />
          <rewrite-uri template="/api" />
        </inbound>
        <backend>
          <base />
        </backend>
        <outbound>
          <base />
        </outbound>
        <on-error>
          <base />
        </on-error>
      </policies>
    '''
  }
}
```

**What it does:**
- Defines API routing and transformation policies
- **XML format**: APIM policies use XML syntax

**Policy Sections:**

1. **`<inbound>`**: Request processing
   - **`<base />`**: Inherits base policies
   - **`<set-backend-service backend-id="..." />`**:
     - Routes request to backend (`barberdist-backend`)
     - Overrides default backend
   - **`<rewrite-uri template="/api" />`**:
     - **URL Rewriting**: Changes request path
     - Example: `/barberdist/api/barbers` → `/api/barbers`
     - Strips APIM path, keeps Function App format

2. **`<backend>`**: Backend request processing
   - **`<base />`**: Inherits base policies
   - Can add: retry logic, timeout, etc.

3. **`<outbound>`**: Response processing
   - **`<base />`**: Inherits base policies
   - Can add: response transformation, headers, etc.

4. **`<on-error>`**: Error handling
   - **`<base />`**: Inherits base error policies
   - Can add: custom error responses

**URL Rewriting Example:**
```
Request:  GET https://barberdist.azure-api.net/barberdist/api/barbers
          ↓ (Policy rewrites)
Forward:   GET https://barberdist-func-dev.azurewebsites.net/api/barbers
```

---

#### **Lines 81-82: Outputs**
```bicep
output apiId string = api.name
output apiPath string = apiPath
```

**What it does:**
- Exposes API details

**Example outputs:**
- `apiId`: `barberdist-api`
- `apiPath`: `barberdist`

---

## Summary

| Module | Purpose | Key Resources Created |
|--------|---------|----------------------|
| **storageAccount.bicep** | Storage for Functions | Storage Account |
| **appServicePlan.bicep** | Compute plan | App Service Plan (Consumption) |
| **functionApp.bicep** | Function App host | Function App (Node.js 18) |
| **apiManagement.bicep** | API gateway | APIM Service + Custom Domain |
| **apimBackend.bicep** | Backend connection | APIM Backend (points to Function App) |
| **apimApis.bicep** | API definition | API + Version Set + Policy |

**Dependency Flow:**
```
Storage Account ──┐
                  ├──> Function App ──┐
App Service Plan ─┘                    │
                                      ├──> APIM Backend ──> APIM APIs
API Management ───────────────────────┘
```

Each module is reusable and can be called from `main.bicep` or other templates.

