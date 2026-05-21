$filePath = "resources/js/components/ecommerce/home-sections.tsx"
$content = Get-Content $filePath -Raw

# Replace all addToCart calls to include slug
$content = $content -replace 'addToCart\(\{\s*productId: product\.id,\s*variantId: null,\s*name: product\.name,', 'addToCart({`
                                            productId: product.id,`
                                            variantId: null,`
                                            slug: product.slug,`
                                            name: product.name,'

$content | Set-Content $filePath
Write-Host "Updated $filePath with slug property"
