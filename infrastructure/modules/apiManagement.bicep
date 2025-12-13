param name string
param location string
param baseUrl string
param environment string
param publisherName string = 'Distrito Barbearia'
param publisherEmail string = 'admin@distritobarbearia.com'
param sku string = 'Consumption'
param skuCount int = 0

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

output apimServiceName string = apiManagementService.name
output apimServiceId string = apiManagementService.id
output gatewayUrl string = 'https://${apiManagementService.properties.gatewayUrl}'
output portalUrl string = 'https://${apiManagementService.properties.portalUrl}'
output managementApiUrl string = apiManagementService.properties.managementApiUrl

