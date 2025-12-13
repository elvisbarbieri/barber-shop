param name string
param location string
param storageAccountName string
param appServicePlanId string

var functionAppVersion = '~4'
var nodeVersion = '18'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

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
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(name)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: functionAppVersion
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~${nodeVersion}'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: ''
        }
      ]
    }
  }
}

output functionAppName string = functionApp.name
output functionAppResourceId string = functionApp.id
output functionAppHostName string = functionApp.properties.defaultHostName
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'

