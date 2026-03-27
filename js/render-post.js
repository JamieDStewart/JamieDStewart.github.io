
// --- Load marked script dynamically ---
function loadMarked() {
  return new Promise((resolve, reject) => {
    if (window.marked) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function loadHighlightJs() {
  return new Promise((resolve, reject) => {
    if (window.hljs) {
      resolve()
      return
    }

    const script = document.createElement('script')    
    script.src = 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}


// --- Core renderer for any markdown target ---
async function renderMarkdownInto(elementId, url) {
  const container = document.getElementById(elementId)
  if (!container) return

  try {
    const response = await fetch(url)
    if (!response.ok) {
      container.textContent = "Failed to load content."
      return
    }

    const md = await response.text()

    // Load Marked only
    await loadMarked()

    marked.setOptions({
      breaks: true,
      gfm: true
    })

    // Render Markdown → HTML
    const html = marked.parse(md)
    container.innerHTML = html

    // 🔍 Check if code blocks exist
    const hasCodeBlocks = container.querySelector('pre code')

    if (hasCodeBlocks) {
      await loadHighlightJs()
      hljs.highlightAll()
    }

  } catch (err) {
    console.error(err)
    container.textContent = "Error loading content."
  }
}


// --- Load welcome post --
renderMarkdownInto("welcome-post", "/_welcome/welcome.md")

// -- Load dynamic post if ?name=.. is present ---
const params = new URLSearchParams(location.search)
const name = params.get("name")
if(name){
  renderMarkdownInto("post", "/_posts/" + name)
}
