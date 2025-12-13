# # # 1. Log in (if you haven't already)
# # # az login

# # 2. Set variables to make commands easier (Bash shell)
# RESOURCE_GROUP="barber-project"
# LOCATION="eastus"
# STORAGE_ACCOUNT="barberstorage01"
# FUNCTION_APP="barber-project"

# # # # 3. Create the Resource Group
# # # az group create --name $RESOURCE_GROUP --location $LOCATION



# # # 4. Create the Storage Account
# # az storage account create --name $STORAGE_ACCOUNT \
# # --location $LOCATION \
# # --resource-group $RESOURCE_GROUP \
# # --sku Standard_LRS

# # # 5. Create the Function App
# # az functionapp create --resource-group $RESOURCE_GROUP \
# # --consumption-plan-location $LOCATION \
# # --runtime python \
# # --runtime-version 3.11 \
# # --functions-version 4 \
# # --name $FUNCTION_APP \
# # --storage-account $STORAGE_ACCOUNT \
# # --os-type Linux

# # echo "Your function app is deployed at: https://$FUNCTION_APP.azurewebsites.net"

# FUNC INIT PRA CRIAR PROJETO
# FUNC NEW PRA GERAR A HTTP FUNCTION

