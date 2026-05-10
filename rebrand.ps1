# rebrand.ps1
# Script para substituir branding Bizagi por Rafael Brito
# Execute após cada exportação do Bizagi Modeler

$ErrorActionPreference = "Stop"
$basePath = $PSScriptRoot

Write-Host "Aplicando rebranding..." -ForegroundColor Cyan

# 1. Substituir logos
$logoSource = Join-Path $basePath "minha_logo.png"
$logoDest1 = Join-Path $basePath "libs\img\biz-ex-logo.png"
$logoDest2 = Join-Path $basePath "libs\img\biz-ex-logo-2x.png"

if (Test-Path $logoSource) {
    Copy-Item $logoSource $logoDest1 -Force
    Copy-Item $logoSource $logoDest2 -Force
    Write-Host "[OK] Logos substituidas" -ForegroundColor Green
} else {
    Write-Host "[ERRO] minha_logo.png nao encontrado na raiz" -ForegroundColor Red
    exit 1
}

# 2. Substituir textos no configuration.json.js
$configFile = Join-Path $basePath "libs\js\json\configuration.json.js"
if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw -Encoding UTF8

    # productName
    $content = $content -replace '"productName":"Bizagi Modeler"', '"productName":"Rafael Brito - Billing and Invoicing Specialist - SAP S/4HANA Utilities"'

    # visitBizagi (texto do link)
    $content = $content -replace '"visitBizagi":"[^"]*"', '"visitBizagi":"Linkedin"'

    # bizagiUrl
    $content = $content -replace '"bizagiUrl":"http://www\.bizagi\.com"', '"bizagiUrl":"https://www.linkedin.com/in/britorafael"'

    Set-Content $configFile $content -Encoding UTF8 -NoNewline
    Write-Host "[OK] configuration.json.js atualizado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] configuration.json.js nao encontrado" -ForegroundColor Red
}

# 3. Substituir textos no index.html
$indexFile = Join-Path $basePath "index.html"
if (Test-Path $indexFile) {
    $content = Get-Content $indexFile -Raw -Encoding UTF8

    # Titulo da pagina
    $content = $content -replace '<title>Publish Web</title>', '<title>Billing Process - Rafael Brito</title>'

    # Link do Bizagi no header
    $content = $content -replace 'href="http://www\.bizagi\.com/"', 'href="https://www.linkedin.com/in/britorafael"'

    # Comentario @author
    $content = $content -replace '@author: UX-Team', '@author: Rafael Brito - Billing and Invoicing Specialist - SAP S/4HANA Utilities'

    # Comentario @url
    $content = $content -replace '@url: http://www\.bizagi\.com', '@url: https://www.linkedin.com/in/britorafael'

    Set-Content $indexFile $content -Encoding UTF8 -NoNewline
    Write-Host "[OK] index.html atualizado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] index.html nao encontrado" -ForegroundColor Red
}

# 4. Ajustar CSS para logo de tamanho diferente
$cssFile = Join-Path $basePath "libs\css\app.css"
if (Test-Path $cssFile) {
    $content = Get-Content $cssFile -Raw -Encoding UTF8

    # Adicionar background-size: contain na classe .biz-ex-logo-img
    # Padrao original: background: url("../img/biz-ex-logo.png") no-repeat;
    $content = $content -replace 'background: url\("\.\.\/img\/biz-ex-logo\.png"\) no-repeat;', 'background: url("../img/biz-ex-logo.png") no-repeat center; background-size: contain;'
    $content = $content -replace 'background: url\("\.\.\/img\/biz-ex-logo-2x\.png"\) no-repeat;', 'background: url("../img/biz-ex-logo-2x.png") no-repeat center; background-size: contain;'

    Set-Content $cssFile $content -Encoding UTF8 -NoNewline
    Write-Host "[OK] app.css atualizado (background-size)" -ForegroundColor Green
} else {
    Write-Host "[ERRO] app.css nao encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "Rebranding concluido!" -ForegroundColor Cyan
Write-Host "Abra index.html no navegador para verificar." -ForegroundColor Gray
