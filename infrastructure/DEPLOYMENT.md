# Step-by-Step Azure Deployment Guide

## Prerequisites Checklist

- [ ] Azure subscription with contributor permissions
- [ ] Azure CLI installed (`az --version`)
- [ ] Logged into Azure (`az login`)
- [ ] Bicep CLI available (`az bicep version`)
- [ ] Node.js and Azure Functions Core Tools installed

## Part 1: Azure CLI Setup

### 1.1 Login to Azure

```bash
az login
```

This will open a browser window for authentication. After login, verify:

```bash
az account show
```

### 1.2 Set Default Subscription (if needed)

```bash
# List subscriptions
az account list --output table

# Set default subscription
az account set --subscription "Your-Subscription-Name-Or-ID"
```

## Part 2: Resource Group Creation

### 2.1 Create Resource Group

```bash
az group create \
  --name rg-barberdist-dev \
  --location eastus
```

**Location Options:**
- `eastus` (US East)
- `westus2` (US West 2)
- `northeurope` (North Europe)
- `southeastasia` (Southeast Asia)

### 2.2 Verify Resource Group

```bash
az group show --name rg-barberdist-dev
```

## Part 3: Deploy Infrastructure with Bicep

### 3.1 Navigate to Infrastructure Directory

```bash
cd infrastructure
```

### 3.2 Deploy Infrastructure

**Option 1: Using Bicep parameters file (if supported):**
```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.bicepparam \
  --verbose
```

**Option 2: Using JSON parameters file (recommended):**
```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json \
  --verbose
```

**Option 3: Inline parameters:**
```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters projectName=barberdist environment=dev location=eastus \
  --verbose
```

**Expected Output:**
- Function App will be created (~2-3 minutes)
- Storage Account will be created (~1 minute)
- App Service Plan will be created (~1 minute)
- API Management will be created (~30-45 minutes - this is the longest step)

**Total Deployment Time:** ~45-60 minutes (mostly APIM)

### 3.3 Monitor Deployment

In another terminal, monitor the deployment:

```bash
az deployment group list \
  --resource-group rg-barberdist-dev \
  --output table
```

### 3.4 Get Deployment Outputs

After deployment completes:

```bash
az deployment group show \
  --resource-group rg-barberdist-dev \
  --name main \
  --query properties.outputs
```

Save these values:
- `functionAppName`: e.g., `barberdist-func-dev`
- `apimGatewayUrl`: e.g., `https://barberdist.azure-api.net`

## Part 4: Configure Function App

### 4.1 Deploy Function Code

From project root directory:

```bash
# Install dependencies first
npm install

# Deploy to Azure
func azure functionapp publish barberdist-func-dev
```

Replace `barberdist-func-dev` with your actual function app name from Step 3.4.

### 4.2 Set Environment Variables

```bash
FUNCTION_APP_NAME="barberdist-func-dev"

az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group rg-barberdist-dev \
  --settings \
    COSMOS_CONNECTION_STRING="your-cosmos-connection-string" \
    GMAIL_USER="your-email@gmail.com" \
    GMAIL_APP_PASSWORD="your-gmail-app-password" \
    DATABASE="distrito-barber" \
    COLLECTION_CHECKIN="distritobarber"
```

**To get Cosmos DB connection string:**
1. Azure Portal → Your Cosmos DB account
2. Connection Strings → Primary Connection String

### 4.3 Verify Function App is Running

```bash
# Test function app directly
curl https://barberdist-func-dev.azurewebsites.net/api/barbers

# Check logs
az functionapp log tail \
  --name $FUNCTION_APP_NAME \
  --resource-group rg-barberdist-dev
```

## Part 5: Configure API Management (Azure Portal)

### 5.1 Open API Management Service

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: **All resources** → `barberdist-apim-dev`
3. Click on the API Management service

### 5.2 Verify Backend Configuration

1. In APIM, go to **Backends**
2. Verify `barberdist-backend` exists
3. Click on it to verify:
   - **Runtime URL**: Should be `https://barberdist-func-dev.azurewebsites.net`
   - **Protocol**: HTTP
   - **Status**: Should show as healthy (green)

If backend doesn't exist or is incorrect, create it:
1. Click **+ Add**
2. Name: `barberdist-backend`
3. Type: **HTTP(s) endpoint**
4. Runtime URL: `https://<your-function-app-name>.azurewebsites.net`
5. Click **Create**

### 5.3 Import API

1. In APIM, go to **APIs**
2. Click **+ Add API**
3. Select **OpenAPI**
4. Choose **Full** tab
5. **Import from**: Select **URL**
6. **Specification URL**: 
   ```
   https://barberdist-func-dev.azurewebsites.net/api/swagger/json
   ```
   (Replace with your function app name)
7. **Display name**: `Distrito Barbearia API`
8. **API URL suffix**: `barberdist`
9. **Base URL**: Leave default
10. Click **Create**

### 5.4 Configure API Settings

1. Click on your API: **Distrito Barbearia API**
2. Go to **Settings** tab
3. **Web service URL**: `https://barberdist-func-dev.azurewebsites.net/api`
4. **Backend**: Select `barberdist-backend` from dropdown
5. Click **Save**

### 5.5 Configure API Policy

1. In your API, select **All operations**
2. Go to **Policies** tab
3. In the **Inbound processing** section, add this policy:

```xml
<set-backend-service backend-id="barberdist-backend" />
<rewrite-uri template="/api" />
```

Or use the policy editor:
1. Click **</>** (code view)
2. In `<inbound>` section, add:
```xml
<set-backend-service backend-id="barberdist-backend" />
<rewrite-uri template="/api" />
```
3. Click **Save**

### 5.6 Test API in APIM

1. In your API, select an operation (e.g., **GET /barbers**)
2. Click **Test** tab
3. Click **Send**
4. Verify you get a response (200 OK with data)

### 5.7 Verify Base URL

Your API should now be accessible at:
```
https://barberdist.azure-api.net/barberdist/barbers
https://barberdist.azure-api.net/barberdist/services
```

## Part 6: Testing

### 6.1 Test Through APIM Gateway

```bash
APIM_URL="https://barberdist.azure-api.net"

# Test barbers endpoint
curl $APIM_URL/barberdist/barbers

# Test services endpoint
curl $APIM_URL/barberdist/services
```

### 6.2 Test with Subscription Key (if required)

```bash
# Get subscription key from Azure Portal
# APIM → Subscriptions → Primary key

SUBSCRIPTION_KEY="your-subscription-key"

curl -H "Ocp-Apim-Subscription-Key: $SUBSCRIPTION_KEY" \
  $APIM_URL/barberdist/barbers
```

## Part 7: Post-Deployment Configuration

### 7.1 Enable CORS (if needed)

In Function App → CORS:
- Add `https://barberdist.azure-api.net`

### 7.2 Configure Authentication (Optional)

1. APIM → APIs → Your API → Settings
2. Enable **Subscription required**: Yes/No
3. Configure authentication policies if needed

### 7.3 Set up Monitoring

1. APIM → Monitoring → Metrics
2. Function App → Monitoring → Application Insights

## Troubleshooting

### Function App Not Deploying

```bash
# Check deployment status
az functionapp show \
  --name barberdist-func-dev \
  --resource-group rg-barberdist-dev

# View logs
az webapp log tail \
  --name barberdist-func-dev \
  --resource-group rg-barberdist-dev
```

### APIM Can't Connect to Backend

1. Verify Function App is running
2. Check backend URL is correct
3. Test backend directly
4. Check Function App CORS settings
5. Verify network connectivity

### API Returns 404

1. Check API path in APIM matches your endpoints
2. Verify rewrite-uri policy is configured
3. Check Function App route configuration
4. Test Function App directly (bypass APIM)

## Cleanup

To delete everything:

```bash
az group delete \
  --name rg-barberdist-dev \
  --yes
```

This will delete all resources in the resource group.

