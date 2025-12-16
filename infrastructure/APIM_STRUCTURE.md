# Azure API Management (APIM) Structure and Base URL Setup

This guide explains how the base URL (`barberdist`) is configured in Azure API Management and the complete structure.

## Overview

The API will be accessible at: **`https://barberdist.azure-api.net`**

## APIM Structure Components

### 1. **APIM Service** (Main Service)
- **Name:** `barberdist-apim-dev`
- **Purpose:** The main API Management service instance
- **SKU:** Consumption (pay-per-use)
- **Base URL Configuration:** Set via custom domain

### 2. **Custom Domain** (Base URL)
- **Domain:** `barberdist.azure-api.net`
- **Purpose:** Sets the base URL for all APIs
- **Location:** APIM Service → Custom domains → Gateway

### 3. **Backend** (Function App Connection)
- **Name:** `barberdist-backend`
- **Purpose:** Points to the Azure Function App
- **URL:** `https://barberdist-func-dev.azurewebsites.net`
- **Type:** HTTP backend

### 4. **API** (API Definition)
- **Name:** `barberdist-api`
- **Display Name:** Distrito Barbearia API
- **Path:** `barberdist`
- **Service URL:** Points to Function App
- **Version:** `v1`

### 5. **API Policy** (Routing Rules)
- **Purpose:** Routes requests from APIM to Function App
- **Backend:** Points to `barberdist-backend`
- **URL Rewrite:** `/api` (strips APIM path)

## Complete URL Structure

```
https://barberdist.azure-api.net/barberdist/api/{function-name}
```

**Example:**
- `https://barberdist.azure-api.net/barberdist/api/barbers`
- `https://barberdist.azure-api.net/barberdist/api/appointments`
- `https://barberdist.azure-api.net/barberdist/api/time-slots`

## Manual Setup Steps (Azure Portal)

If you need to set this up manually instead of using Bicep:

### Step 1: Create APIM Service

1. Go to Azure Portal → **Create a resource**
2. Search for **API Management**
3. Click **Create**
4. Configure:
   - **Subscription:** Your subscription
   - **Resource Group:** `rg-barberdist-dev`
   - **Region:** `East US`
   - **Resource name:** `barberdist-apim-dev`
   - **Organization name:** `Distrito Barbearia`
   - **Administrator email:** Your email
   - **Pricing tier:** `Consumption` (pay-per-use)
5. Click **Review + create** → **Create**

**Wait:** Takes 30-45 minutes to provision

### Step 2: Configure Custom Domain (Base URL)

1. Go to your APIM service → **Custom domains**
2. Click **+ Add**
3. Select **Gateway** domain type
4. Enter domain name: `barberdist.azure-api.net`
5. Click **Add**
6. **Note:** This is automatically configured by Azure (no certificate needed for `.azure-api.net`)

### Step 3: Create Backend

1. Go to APIM → **Backends**
2. Click **+ Add**
3. Configure:
   - **Name:** `barberdist-backend`
   - **Type:** HTTP(s) endpoint
   - **Runtime URL:** `https://barberdist-func-dev.azurewebsites.net`
   - **Protocol:** `http`
4. Click **Create**

### Step 4: Import/Create API

1. Go to APIM → **APIs**
2. Click **+ Add API** → **HTTP**
3. Configure:
   - **Display name:** `Distrito Barbearia API`
   - **Name:** `barberdist-api`
   - **Web service URL:** `https://barberdist-func-dev.azurewebsites.net`
   - **API URL suffix:** `barberdist`
   - **Protocols:** `HTTPS`
4. Click **Create**

### Step 5: Configure API Policy

1. Go to your API → **All operations** → **Policies**
2. Click **</>** (Code view)
3. Add this policy in the `<inbound>` section:

```xml
<policies>
  <inbound>
    <base />
    <set-backend-service backend-id="barberdist-backend" />
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
```

4. Click **Save**

### Step 6: Import Operations (Optional - Manual)

If you want to manually add operations:

1. Go to API → **+ Add operation**
2. For each endpoint:
   - **Display name:** `Get Barbers`
   - **URL:** `GET /barbers`
   - **Backend:** Select `barberdist-backend`
   - **Backend URL:** `/api/barbers`

Repeat for:
- `POST /appointments`
- `POST /time-slots`
- `POST /appointment/confirmation`
- `GET /services`

### Step 7: Import from OpenAPI (Recommended)

1. Go to API → **...** → **Import**
2. Select **OpenAPI**
3. Choose **From file** or **From URL**
4. Upload your `swagger.yaml` file
5. Configure:
   - **API URL suffix:** `barberdist`
   - **Base URL:** Leave default
6. Click **Create**

## How Bicep Templates Create This Structure

### 1. `apiManagement.bicep`
Creates:
- APIM Service instance
- Custom domain (`barberdist.azure-api.net`)

### 2. `apimBackend.bicep`
Creates:
- Backend resource pointing to Function App

### 3. `apimApis.bicep`
Creates:
- API definition with path `barberdist`
- API version set
- API policy for routing

## Testing the Setup

### 1. Test via Azure Portal

1. Go to APIM → **APIs** → Your API
2. Click on an operation (e.g., `GET /barbers`)
3. Click **Test** tab
4. Click **Send**
5. Check response

### 2. Test via cURL

```bash
# Get subscription key from APIM → Subscriptions
SUBSCRIPTION_KEY="your-subscription-key"
APIM_URL="https://barberdist.azure-api.net"

# Test barbers endpoint
curl -H "Ocp-Apim-Subscription-Key: $SUBSCRIPTION_KEY" \
  "$APIM_URL/barberdist/api/barbers"

# Test services endpoint
curl -H "Ocp-Apim-Subscription-Key: $SUBSCRIPTION_KEY" \
  "$APIM_URL/barberdist/api/services"
```

### 3. Test via Postman

1. Create new request
2. URL: `https://barberdist.azure-api.net/barberdist/api/barbers`
3. Headers:
   - `Ocp-Apim-Subscription-Key`: Your subscription key
4. Send request

## Understanding the URL Path

```
https://barberdist.azure-api.net/barberdist/api/barbers
│                              │         │    │
│                              │         │    └─ Function endpoint
│                              │         └────── Function app prefix (/api)
│                              └────────────────── API path (from APIM)
└───────────────────────────────────────────────── Base URL (custom domain)
```

## Subscription Keys

APIM uses subscription keys for access control:

1. Go to APIM → **Subscriptions**
2. Find **Built-in all-access subscription**
3. Copy **Primary key** or **Secondary key**
4. Use in requests as header: `Ocp-Apim-Subscription-Key`

## Troubleshooting

### API Returns 404

1. Check API path is correct: `/barberdist/api/{endpoint}`
2. Verify Function App is running
3. Check backend URL is correct
4. Verify API policy is configured

### Backend Connection Failed

1. Verify Function App URL is accessible
2. Check Function App is running
3. Verify CORS settings in Function App
4. Check backend configuration

### Custom Domain Not Working

1. Verify domain is added in Custom domains
2. Check domain status (should be "Ready")
3. Wait for DNS propagation (can take a few minutes)

## Next Steps

After setup:
1. Configure authentication (if needed)
2. Set up rate limiting policies
3. Configure monitoring and analytics
4. Set up custom domains (if using your own domain)
5. Configure API versioning

