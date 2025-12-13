param name string
param location string
param sku string = 'Y1'
param tier string = 'Dynamic'

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

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name

