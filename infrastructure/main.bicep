targetScope = 'resourceGroup'

param location string = resourceGroup().location
param projectName string = 'barberdist'
param environment string = 'dev'

var functionAppName = '${projectName}-func-${environment}'
var storageAccountPrefix = substring(replace(projectName, '-', ''), 0, min(10, length(replace(projectName, '-', ''))))
var storageAccountSuffix = substring(uniqueString(resourceGroup().id), 0, 13)
var storageAccountName = '${storageAccountPrefix}${storageAccountSuffix}'
var appServicePlanName = '${projectName}-plan-${environment}'
var apimServiceName = '${projectName}-apim-${environment}'
var apimBaseUrl = projectName

module storageAccount './modules/storageAccount.bicep' = {
  name: 'storageAccount'
  params: {
    name: storageAccountName
    location: location
  }
}

module appServicePlan './modules/appServicePlan.bicep' = {
  name: 'appServicePlan'
  params: {
    name: appServicePlanName
    location: location
  }
}

module functionApp './modules/functionApp.bicep' = {
  name: 'functionApp'
  params: {
    name: functionAppName
    location: location
    storageAccountName: storageAccountName
    appServicePlanId: appServicePlan.outputs.appServicePlanId
  }
  dependsOn: [
    storageAccount
  ]
}

module apiManagement './modules/apiManagement.bicep' = {
  name: 'apiManagement'
  params: {
    name: apimServiceName
    location: location
    baseUrl: apimBaseUrl
  }
}

module apimBackend './modules/apimBackend.bicep' = {
  name: 'apimBackend'
  params: {
    apimServiceName: apimServiceName
    functionAppResourceId: functionApp.outputs.functionAppResourceId
    functionAppHostName: functionApp.outputs.functionAppHostName
    backendId: 'barberdist-backend'
  }
  dependsOn: [
    functionApp
    apiManagement
  ]
}

module apimApis './modules/apimApis.bicep' = {
  name: 'apimApis'
  params: {
    apimServiceName: apimServiceName
    backendId: 'barberdist-backend'
    serviceUrl: functionApp.outputs.functionAppUrl
  }
  dependsOn: [
    apimBackend
    functionApp
  ]
}

output functionAppName string = functionApp.outputs.functionAppName
output functionAppUrl string = functionApp.outputs.functionAppUrl
output apimServiceName string = apiManagement.outputs.apimServiceName
output apimGatewayUrl string = apiManagement.outputs.gatewayUrl
output apimPortalUrl string = apiManagement.outputs.portalUrl
output apimBaseUrl string = apimBaseUrl

