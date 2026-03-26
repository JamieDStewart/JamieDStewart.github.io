// --- Utility: wait until Markdeep is fully loaded ---
function waitForMarkdeepReady() {
  return new Promise(resolve => {
    if (window.markdeep && window.markdeep.formatFragment) {
      resolve()
      return
    }

    const check = setInterval(() => {
      if (window.markdeep && window.markdeep.formatFragment) {
        clearInterval(check)
        resolve()
      }
    }, 50)
  })
}

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

// --- Load post name from URL ---
const params = new URLSearchParams(location.search)
const name = params.get("name")

// --- Fetch and render the post ---
async function renderPost() {
  if (!name) return

  const response = await fetch("/_posts/" + name)
  const md = await response.text()

  const post = document.getElementById("post")
  post.textContent = md   // Use textContent to preserve whitespace for code blocks

  // Load marked and process
  await loadMarked()

  // Configure marked to allow HTML and use highlight.js for code
  marked.setOptions({
    breaks: true,
    gfm: true
  })

  post.innerHTML = marked.parse(md)
}

renderPost()
