param apimServiceName string
param functionAppResourceId string
param functionAppHostName string
param backendId string

resource apimService 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimServiceName
}

resource backend 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apimService
  name: backendId
  properties: {
    description: 'Backend for Barber Distrito Functions'
    url: 'https://${functionAppHostName}'
    protocol: 'http'
    resourceId: functionAppResourceId
    credentials: {
      certificate: []
      query: {}
      header: {}
    }
    tls: {
      validateCertificateChain: true
      validateCertificateName: true
    }
  }
}

output backendId string = backend.name
output backendUrl string = backend.properties.url

