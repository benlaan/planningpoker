function Start-Clients([string]$server = "localhost:54238", [switch]$endWebDev)
{
	if ($endWebDev.IsPresent) { Kill-WebDev }

	Invoke-Chrome "http://$server/#host"
	Invoke-Chrome "http://$server/#host"

	#Invoke-Chrome "http://$server/#join"
	#Invoke-Chrome "http://$server/#join"
	#Invoke-Chrome "http://$server/#join"

	#Invoke-Chrome "http://$server/#view"
}

function Kill-WebDev
{
	$processes = ps WebDev.WebServer40 -ErrorAction SilentlyContinue
	if ($processes -ne $null) { $processes | stop-process }
}

function Invoke-Chrome([string]$url = "")
{
	$arguments = @()
	if($url -ne $null) { $arguments += $url }
	Start-Process "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" -ArgumentList $arguments
}

Set-Alias -Name bs -Value Start-Clients -Option AllScope
Set-Alias -Name kwd -Value Kill-WebDev -Option AllScope
Set-Alias -Name chrome -Value Invoke-Chrome -Option AllScope
