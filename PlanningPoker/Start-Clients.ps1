param(
    [string]$server = "localhost:54238"
)

function Invoke-Chrome([string]$url = "")
{
	$arguments = @()
	if($url -ne $null) { $arguments += $url }
	Start-Process "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" -ArgumentList $arguments
}

Set-Alias -Name chrome -Value Invoke-Chrome -Option AllScope

#chrome "http://$server/#host"

chrome "http://$server/#join"
chrome "http://$server/#join"
chrome "http://$server/#join"

chrome "http://$server/#view"

