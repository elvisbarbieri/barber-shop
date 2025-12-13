# Azure Infrastructure Deployment

This directory contains Bicep templates for deploying the Distrito Barbearia API to Azure.

## Architecture

The infrastructure includes:
- **Azure Functions**: Hosts the Node.js API
- **Azure API Management (APIM)**: Exposes the API with base URL `barberdist`
- **Storage Account**: Required for Azure Functions
- **App Service Plan**: Consumption plan for Functions

## Base URL

The API will be accessible at: `https://barberdist.azure-api.net`

## Prerequisites

1. **Azure CLI** installed and configured
   ```bash
   az --version
   az login
   ```

2. **Bicep CLI** (usually included with Azure CLI)
   ```bash
   az bicep version
   ```

3. **Azure Subscription** with permissions to create:
   - Resource Groups
   - Function Apps
   - API Management services
   - Storage Accounts

4. **Node.js** installed (for local development)

## Deployment Steps

### Step 1: Create Resource Group

```bash
az group create \
  --name rg-barberdist-dev \
  --location eastus
```

### Step 2: Deploy Infrastructure

Deploy using the Bicep template:

```bash
cd infrastructure

az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters parameters.dev.bicepparam
```

Or using the parameter file directly:

```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.bicepparam
```

### Step 3: Deploy Function App Code

After infrastructure is deployed, deploy your function code:

```bash
# From project root
func azure functionapp publish <function-app-name>
```

The function app name will be in the deployment output (e.g., `barberdist-func-dev`).

### Step 4: Configure Environment Variables

Set environment variables in Azure Functions:

```bash
# Get function app name from deployment output
FUNCTION_APP_NAME="barberdist-func-dev"

# Set environment variables
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group rg-barberdist-dev \
  --settings \
    COSMOS_CONNECTION_STRING="your-cosmos-connection-string" \
    GMAIL_USER="your-email@gmail.com" \
    GMAIL_APP_PASSWORD="your-app-password" \
    DATABASE="distrito-barber" \
    COLLECTION_CHECKIN="distritobarber"
```

### Step 5: Configure API Management Backend

The APIM backend is automatically configured by the Bicep template. However, you may need to:

1. **Import/Update API**: The template attempts to import from Swagger, but you can manually import:
   - Go to Azure Portal → API Management → Your APIM instance
   - APIs → Add API → OpenAPI specification
   - Upload your `swagger.yaml` or paste the JSON

2. **Verify Backend Configuration**:
   - Go to APIs → Backends
   - Verify `barberdist-backend` is configured correctly
   - Test backend connection

### Step 6: Test the API

Test the API through APIM:

```bash
# Get APIM gateway URL from deployment output
APIM_URL="https://barberdist.azure-api.net"

# Test an endpoint
curl $APIM_URL/barberdist/barbers
```

## Manual Azure Portal Steps

### Configure API Management (Alternative Manual Method)

1. **Navigate to API Management**:
   - Azure Portal → Your APIM instance (`barberdist-apim-dev`)

2. **Create Backend**:
   - Go to **Backends** → **Add**
   - Name: `barberdist-backend`
   - Type: `HTTP(s) endpoint`
   - Runtime URL: `https://<your-function-app-name>.azurewebsites.net`
   - Protocol: `HTTP`
   - Click **Create**

3. **Import API**:
   - Go to **APIs** → **Add API** → **OpenAPI**
   - Select **Full** tab
   - Upload your `swagger.yaml` file OR
   - Enter JSON URL: `https://<your-function-app-name>.azurewebsites.net/api/swagger/json`
   - Display name: `Distrito Barbearia API`
   - API URL suffix: `barberdist`
   - Click **Create**

4. **Configure API Backend**:
   - Select your API → **Settings** tab
   - Web service URL: `https://<your-function-app-name>.azurewebsites.net/api`
   - Backend: Select `barberdist-backend`

5. **Add Policy (if needed)**:
   - Select your API → **All operations** → **Policies**
   - Inbound: Add rewrite-uri policy:
   ```xml
   <rewrite-uri template="/api" />
   ```
   - Save

6. **Test API**:
   - Go to your API → Select an operation (e.g., `GET /barbers`)
   - Click **Test** tab
   - Click **Send**
   - Verify response

### Configure Custom Domain (Optional)

1. **Get APIM Gateway URL**:
   - APIM → Overview → Gateway URL

2. **Add Custom Domain**:
   - APIM → Custom domains
   - Add custom domain (requires DNS configuration)

## Outputs

After deployment, you'll get these outputs:

- `functionAppName`: Name of the Function App
- `functionAppUrl`: URL of the Function App
- `apimServiceName`: Name of the APIM service
- `apimGatewayUrl`: Gateway URL (e.g., `https://barberdist.azure-api.net`)
- `apimPortalUrl`: Developer portal URL
- `apimBaseUrl`: Base URL for API (`barberdist`)

## API Endpoints

Once deployed, your APIs will be accessible at:

- `https://barberdist.azure-api.net/barberdist/barbers`
- `https://barberdist.azure-api.net/barberdist/services`
- `https://barberdist.azure-api.net/barberdist/appointments`
- `https://barberdist.azure-api.net/barberdist/time-slots`
- `https://barberdist.azure-api.net/barberdist/appointment/confirmation`

## Troubleshooting

### Function App Deployment Issues

```bash
# Check function app logs
az functionapp log tail \
  --name <function-app-name> \
  --resource-group rg-barberdist-dev
```

### APIM Backend Connection Issues

1. Verify Function App is running
2. Check Function App CORS settings
3. Verify backend URL in APIM
4. Test backend directly: `curl https://<function-app>.azurewebsites.net/api/barbers`

### API Not Showing in APIM

1. Check if API was imported successfully
2. Verify backend is configured
3. Check API policies
4. Review APIM diagnostic logs

## Cleanup

To delete all resources:

```bash
az group delete \
  --name rg-barberdist-dev \
  --yes --no-wait
```

## Cost Considerations

- **Consumption Plan**: Pay per execution (free tier available)
- **APIM Consumption**: Pay per API call (free tier: 1M calls/month)
- **Storage Account**: Minimal cost for Functions storage

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, Azure DevOps)
2. Configure custom domain and SSL certificate
3. Set up monitoring and alerts
4. Configure API policies (rate limiting, authentication)
5. Set up staging environment

