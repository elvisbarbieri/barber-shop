# How to Request Azure Consumption Plan Quota Increase

This guide walks you through requesting quota increase for Azure Functions Consumption Plan (Dynamic VMs) in Azure Portal.

## Why You Need This

Azure Functions Consumption Plan requires quota for **Dynamic VMs** in your subscription. Your current quota is **0**, which prevents creating the App Service Plan.

## Step-by-Step Instructions

### Step 1: Navigate to Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Azure account

### Step 2: Open Your Subscription

1. In the top search bar, type: **"Subscriptions"**
2. Click on **Subscriptions** from the results
3. Click on your subscription name (the one you're using for deployment)

### Step 3: Navigate to Usage + Quotas

1. In the left menu, scroll down to **Settings**
2. Click on **Usage + quotas**

**Alternative path:**
- Left menu → **Usage + quotas** (under Settings section)

### Step 4: Filter for Dynamic VMs Quota

1. At the top, you'll see filter options
2. Set the following filters:

   **Filter 1: Provider**
   - Click **"Provider"** dropdown
   - Select: **`Microsoft.Compute`**

   **Filter 2: Location**
   - Click **"Location"** dropdown
   - Select: **`East US`** (or your deployment region)

   **Filter 3: Resource Type**
   - Look for a filter/search box
   - Type: **"Dynamic"** or **"Standard BS Family vCPUs"**
   - Select the option that mentions **"Dynamic VMs"** or **"Consumption"**

### Step 5: Find the Quota Entry

You should see a row showing:
- **Name**: Something like "Standard BS Family vCPUs" or "Dynamic VMs"
- **Current Limit**: `0`
- **Current Usage**: `0`
- **Limit Type**: `Default`

### Step 6: Request Quota Increase

1. Click on the quota row (the one with `0` limit)
2. Click the **"Request increase"** button at the top
   - Or click **"..."** (three dots) → **"Request quota increase"**

### Step 7: Fill Out the Request Form

1. **New limit**: Enter **`10`** (recommended for development)
   - Minimum: `1` (but `10` gives you room to scale)
   - For production, consider `20-50` or more

2. **Request reason**: Enter:
   ```
   Azure Functions Consumption Plan deployment for barber-shop project. 
   Need Dynamic VM quota to create App Service Plan (Consumption tier).
   ```

3. **Support contact details** (if required):
   - Enter your email address
   - Enter your phone number (optional)

### Step 8: Submit the Request

1. Click **"Submit"** or **"Save"**
2. You'll see a confirmation message

### Step 9: Wait for Approval

- **Typical wait time**: 15 minutes to 24 hours
- **Most common**: Approved within 1-2 hours
- You'll receive an email notification when approved

### Step 10: Verify Quota Increase

1. Go back to **Subscriptions** → **Usage + quotas**
2. Apply the same filters (Microsoft.Compute, East US, Dynamic VMs)
3. Check that **Current Limit** is now `10` (or your requested amount)

## Alternative: Check Quota via Azure CLI

You can also check quota using Azure CLI:

```bash
# List all quotas for your subscription
az vm list-usage \
  --location eastus \
  --output table

# Look for entries with "Dynamic" or "Consumption" in the name
```

## What Happens After Approval

Once quota is approved:

1. **Re-run your Bicep deployment:**
   ```bash
   cd infrastructure
   az deployment group create \
     --resource-group rg-barberdist-dev \
     --template-file main.bicep \
     --parameters projectName=barberdist environment=dev location=eastus \
     --name main \
     --verbose
   ```

2. The deployment should now succeed (storage account name is also fixed)

## Troubleshooting

### Can't Find "Dynamic VMs" in Filter

**Try these alternatives:**
- Search for: **"Standard BS Family vCPUs"**
- Search for: **"Consumption"**
- Look under **"Compute"** category
- Try different regions if East US doesn't show it

### Request Form Not Appearing

**Possible reasons:**
- Your subscription type doesn't support quota requests
- You don't have sufficient permissions
- Try using a different subscription

**Solution:**
- Contact your Azure subscription administrator
- Or use a different subscription that already has quota

### Request Denied

**Common reasons:**
- Subscription type limitations
- Regional restrictions
- Account verification needed

**Solutions:**
1. Try a different Azure region
2. Use a different subscription
3. Contact Azure Support

## Quick Reference

**What you're requesting:**
- **Resource**: Dynamic VMs (Consumption Plan)
- **Location**: East US
- **Current Limit**: 0
- **Requested Limit**: 10 (recommended)

**Why you need it:**
- Azure Functions Consumption Plan requires Dynamic VM quota
- Without quota, you cannot create the App Service Plan

## Next Steps After Quota Approval

1. ✅ Verify quota increase in Azure Portal
2. ✅ Re-run Bicep deployment
3. ✅ Deploy Function App code
4. ✅ Configure environment variables
5. ✅ Test API endpoints

---

**Note:** The storage account name length issue has been fixed in `main.bicep`. Once quota is approved, your deployment should succeed.

