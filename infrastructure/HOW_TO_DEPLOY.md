# How to Execute Bicep Templates - Step by Step

This guide shows you exactly how to deploy the infrastructure using Bicep templates.

## Prerequisites

1. **Azure CLI installed**
   ```bash
   az --version
   ```

2. **Logged into Azure**
   ```bash
   az login
   ```

3. **Verify subscription**
   ```bash
   az account show
   ```

## Step 1: Create Resource Group

```bash
az group create \
  --name rg-barberdist-dev \
  --location eastus
```

**Note:** Change `eastus` to your preferred region if needed.

## Step 2: Navigate to Infrastructure Directory

```bash
cd infrastructure
```

## Step 3: Deploy Bicep Template

Choose **ONE** of these methods:

### Method 1: Using JSON Parameters File (Recommended) ✅

```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json \
  --name main \
  --verbose
```

### Method 2: Using Inline Parameters

```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters projectName=barberdist environment=dev location=eastus \
  --name main \
  --verbose
```

### Method 3: Using Bicep Parameters File (if supported)

```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.bicepparam \
  --name main \
  --verbose
```

## What Happens During Deployment

The deployment will create:

1. **Storage Account** (~1 minute)
2. **App Service Plan** (~1 minute)
3. **Function App** (~2-3 minutes)
4. **API Management** (~30-45 minutes) ⏱️ **This is the longest step**

**Total time:** ~45-60 minutes

## Step 4: Monitor Deployment

While deployment is running, you can monitor it:

### Option A: Check in Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: **Resource Groups** → `rg-barberdist-dev`
3. Click **Deployments** to see progress

### Option B: Check via CLI
```bash
az deployment group list \
  --resource-group rg-barberdist-dev \
  --output table
```

### Option C: Watch deployment status
```bash
az deployment group show \
  --resource-group rg-barberdist-dev \
  --name main \
  --query properties.provisioningState
```

## Step 5: Get Deployment Outputs

After deployment completes successfully, get the important values:

```bash
az deployment group show \
  --resource-group rg-barberdist-dev \
  --name main \
  --query properties.outputs
```

**Save these values:**
- `functionAppName`: e.g., `barberdist-func-dev`
- `functionAppUrl`: e.g., `https://barberdist-func-dev.azurewebsites.net`
- `apimServiceName`: e.g., `barberdist-apim-dev`
- `apimGatewayUrl`: e.g., `https://barberdist.azure-api.net`

## Step 6: Verify Resources Created

```bash
# List all resources in the group
az resource list \
  --resource-group rg-barberdist-dev \
  --output table

# Check Function App
az functionapp show \
  --name barberdist-func-dev \
  --resource-group rg-barberdist-dev

# Check APIM
az apim show \
  --name barberdist-apim-dev \
  --resource-group rg-barberdist-dev
```

## Troubleshooting

### Error: "Template validation failed"

**Solution:** Check Bicep syntax:
```bash
cd infrastructure
az bicep build --file main.bicep
```

### Error: "Storage account name too long"

**Solution:** Already fixed in the template. Ensure you're using the latest version.

### Error: "Subscription quota exceeded"

**Solution:** Request quota increase for Consumption plan (Dynamic VMs) in Azure Portal.

### Error: "Resource group not found"

**Solution:** Create the resource group first (Step 1).

### Deployment Failed - How to Check Logs

```bash
# Get deployment operation details
az deployment operation group list \
  --resource-group rg-barberdist-dev \
  --name main \
  --output table

# Get specific error details
az deployment group show \
  --resource-group rg-barberdist-dev \
  --name main \
  --query properties.error
```

## Next Steps After Deployment

1. **Deploy Function App Code:**
   ```bash
   cd ..
   npm install
   func azure functionapp publish barberdist-func-dev
   ```

2. **Set Environment Variables:**
   ```bash
   az functionapp config appsettings set \
     --name barberdist-func-dev \
     --resource-group rg-barberdist-dev \
     --settings \
       COSMOS_CONNECTION_STRING="your-connection-string" \
       GMAIL_USER="your-email@gmail.com" \
       GMAIL_APP_PASSWORD="your-app-password" \
       DATABASE="distrito-barber" \
       COLLECTION_CHECKIN="distritobarber"
   ```

3. **Test the API:**
   ```bash
   curl https://barberdist.azure-api.net/barberdist/api/barbers
   ```

## Quick Reference

**Most Common Command:**
```bash
cd infrastructure
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json \
  --verbose
```

**Check if deployment succeeded:**
```bash
az deployment group show \
  --resource-group rg-barberdist-dev \
  --name main \
  --query properties.provisioningState
```

Expected output: `"Succeeded"`

