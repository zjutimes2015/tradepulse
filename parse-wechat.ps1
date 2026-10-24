$html = Get-Content "D:\mksaas模版\wechat-article.html" -Raw -Encoding UTF8

# Extract title
$titleMatch = [regex]::Match($html, '<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)</h1>')
if ($titleMatch.Success) {
    Write-Output "TITLE: $($titleMatch.Groups[1].Value.Trim())"
}

# Extract meta description
$metaDesc = [regex]::Match($html, '<meta\s+name="description"\s+content="([^"]+)"')
if ($metaDesc.Success) {
    Write-Output "DESC: $($metaDesc.Groups[1].Value)"
}

# Extract og:title
$ogTitle = [regex]::Match($html, '<meta\s+property="og:title"\s+content="([^"]+)"')
if ($ogTitle.Success) {
    Write-Output "OG_TITLE: $($ogTitle.Groups[1].Value)"
}

# Extract og:description
$ogDesc = [regex]::Match($html, '<meta\s+property="og:description"\s+content="([^"]+)"')
if ($ogDesc.Success) {
    Write-Output "OG_DESC: $($ogDesc.Groups[1].Value)"
}

# Extract article author
$authorMatch = [regex]::Match($html, '<a[^>]*id="js_name"[^>]*>([\s\S]*?)</a>')
if ($authorMatch.Success) {
    Write-Output "AUTHOR: $($authorMatch.Groups[1].Value.Trim())"
}

# Extract publish time
$timeMatch = [regex]::Match($html, 'var\s+createTime\s*=\s*[`'"]([^`'"]+)[`'"]')
if ($timeMatch.Success) {
    Write-Output "PUB_TIME: $($timeMatch.Groups[1].Value)"
}

# Extract article content (text only, strip HTML tags)
$contentMatch = [regex]::Match($html, '<div[^>]*id="js_content"[^>]*>([\s\S]*?)</div>\s*<script')
if ($contentMatch.Success) {
    $content = $contentMatch.Groups[1].Value
    # Replace <p> and <br> with newlines
    $content = $content -replace '<p[^>]*>', "`n" -replace '</p>', "`n" -replace '<br[^>]*>', "`n" -replace '<h[1-6][^>]*>', "`n" -replace '</h[1-6]>', "`n"
    # Strip all other HTML tags
    $content = $content -replace '<[^>]+>', ''
    # Decode HTML entities
    $content = $content -replace '&nbsp;', ' ' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' -replace '&#39;', "'"
    # Clean up whitespace
    $content = $content -replace "`r`n", "`n" -replace "`n{3,}", "`n`n" -replace "^\s+", '' -replace "\s+$", ''
    Write-Output "CONTENT_START"
    Write-Output $content
    Write-Output "CONTENT_END"
} else {
    Write-Output "Content section not found"
}
