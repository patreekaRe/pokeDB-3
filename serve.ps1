# Tiny local web server for previewing the game (no Node or Python needed).
# Run:  powershell -ExecutionPolicy Bypass -File serve.ps1   then open http://localhost:8123
param([int]$Port = 8123)

$root = $PSScriptRoot
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript'; '.css' = 'text/css'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.gif' = 'image/gif'; '.svg' = 'image/svg+xml'
  '.json' = 'application/json'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $root $path
  if ((Test-Path $file -PathType Leaf) -and $file.StartsWith($root)) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentType = $mime[[IO.Path]::GetExtension($file).ToLower()]
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
