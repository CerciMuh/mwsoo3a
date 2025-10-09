# API Gateway Setup for Student Encyclopedia
# Resource IDs:
# /encyclopedia/degrees: gx4jsf
# /encyclopedia/degrees/{id}: qw952g
# /encyclopedia/degrees/{id}/courses: b3sxks
# /encyclopedia/courses/{id}: htj18a
# /encyclopedia/courses/{id}/notes: tra3wd
# /encyclopedia/notes/{id}: vqh9tm

$resources = @("gx4jsf", "qw952g", "b3sxks", "htj18a", "tra3wd", "vqh9tm")
$lambdaArn = "arn:aws:lambda:eu-central-1:345204682082:function:StudentEncyclopedia"

foreach ($resourceId in $resources) {
    Write-Host "Setting up resource: $resourceId"
    
    # Add GET method
    aws apigateway put-method --rest-api-id abhyzb0eoe --resource-id $resourceId --http-method GET --authorization-type NONE --region eu-central-1 --profile mwsoo3a
    
    # Add Lambda integration
    aws apigateway put-integration --rest-api-id abhyzb0eoe --resource-id $resourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/$lambdaArn/invocations" --region eu-central-1 --profile mwsoo3a
}

Write-Host "Adding Lambda permissions..."
aws lambda add-permission --function-name StudentEncyclopedia --statement-id apigateway-encyclopedia-get --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:eu-central-1:345204682082:abhyzb0eoe/*/GET/encyclopedia/*" --region eu-central-1 --profile mwsoo3a

Write-Host "Deploying API..."
aws apigateway create-deployment --rest-api-id abhyzb0eoe --stage-name prod --region eu-central-1 --profile mwsoo3a
