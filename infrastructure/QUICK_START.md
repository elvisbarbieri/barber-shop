# Quick Start Guide - Azure Deployment

## TL;DR - Fastest Path to Deploy

### 1. Prerequisites
```bash
az login
az account show  # Verify your subscription
```

### 2. Create Resource Group
```bash
az group create --name rg-barberdist-dev --location eastus
```

### 3. Deploy Infrastructure (takes ~45-60 minutes)
```bash
cd infrastructure
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json
```

Or with inline parameters:
```bash
az deployment group create \
  --resource-group rg-barberdist-dev \
  --template-file main.bicep \
  --parameters projectName=barberdist environment=dev location=eastus
```

### 4. Deploy Function App Code
```bash
cd ..
npm install
func azure functionapp publish barberdist-func-dev
```

### 5. Configure Environment Variables
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

### 6. Configure API Management (Azure Portal)

**Go to Azure Portal** → Your APIM instance (`barberdist-apim-dev`)

1. **Create Backend** (if not exists):
   - Backends → + Add
   - Name: `barberdist-backend`
   - URL: `https://barberdist-func-dev.azurewebsites.net`
   
2. **Import API**:
   - APIs → + Add API → OpenAPI
   - URL: `https://barberdist-func-dev.azurewebsites.net/api/swagger/json`
   - Display name: `Distrito Barbearia API`
   - API URL suffix: `barberdist`
   
3. **Configure API**:
   - Settings → Web service URL: `https://barberdist-func-dev.azurewebsites.net/api`
   - Settings → Backend: Select `barberdist-backend`
   
4. **Add Policy**:
   - All operations → Policies
   - Inbound → Add:
   ```xml
   <set-backend-service backend-id="barberdist-backend" />
   <rewrite-uri template="/api" />
   ```

### 7. Test Your API

```bash
curl https://barberdist.azure-api.net/barberdist/barbers
```

## Base URL

Your API will be accessible at:
- **Base URL**: `https://barberdist.azure-api.net`
- **Full endpoint**: `https://barberdist.azure-api.net/barberdist/{endpoint}`

Examples:
- `https://barberdist.azure-api.net/barberdist/barbers`
- `https://barberdist.azure-api.net/barberdist/services`
- `https://barberdist.azure-api.net/barberdist/appointments`

## Important Notes

- **Deployment Time**: APIM takes 30-45 minutes to create
- **Cost**: Consumption tier has free tier (1M calls/month)
- **Swagger**: Your Function App should expose Swagger at `/api/swagger/json`

For detailed steps, see [DEPLOYMENT.md](./DEPLOYMENT.md)

