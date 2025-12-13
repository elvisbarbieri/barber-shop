param apimServiceName string
param backendId string
param serviceUrl string

var apiName = 'barberdist-api'
var apiDisplayName = 'Distrito Barbearia API'
var apiDescription = 'RESTful API for managing barbers, services, appointments, and sending confirmation emails'
var apiPath = 'barberdist'
var apiVersion = 'v1'
var apiVersionSetId = 'barberdist-versions'

resource apimService 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimServiceName
}

resource apiVersionSet 'Microsoft.ApiManagement/service/apiVersionSets@2023-05-01-preview' = {
  parent: apimService
  name: apiVersionSetId
  properties: {
    displayName: apiDisplayName
    versioningScheme: 'Segment'
    description: 'Version set for ${apiDisplayName}'
  }
}

resource api 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apimService
  name: apiName
  properties: {
    displayName: apiDisplayName
    description: apiDescription
    serviceUrl: serviceUrl
    path: apiPath
    protocols: [
      'https'
    ]
    subscriptionRequired: false
    apiVersion: apiVersion
    apiVersionSetId: resourceId('Microsoft.ApiManagement/service/apiVersionSets', apimServiceName, apiVersionSetId)
    subscriptionKeyParameterNames: {
      header: 'Ocp-Apim-Subscription-Key'
      query: 'subscription-key'
    }
  }
}

resource apiBackend 'Microsoft.ApiManagement/service/apis/backends@2023-05-01-preview' = {
  parent: api
  name: backendId
  properties: {
    backendId: '/backends/${backendId}'
  }
}

resource apiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: api
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <base />
          <set-backend-service backend-id="${backendId}" />
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
    '''
  }
}

output apiId string = api.name
output apiPath string = apiPath

