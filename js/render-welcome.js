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

// --- Fetch and render the welcome post ---
async function renderWelcome() {
  const post = document.getElementById("welcome-post")
  if (!post) return

  try {
    const response = await fetch("/_welcome/welcome.md")
    if (!response.ok) {
      post.textContent = "Failed to load welcome content."
      return
    }

    const md = await response.text()

    // Load marked and process
    await loadMarked()

    marked.setOptions({
      breaks: true,
      gfm: true
    })

    post.innerHTML = marked.parse(md)
  } catch (err) {
    console.error(err)
    post.textContent = "Error loading welcome content."
  }
}

renderWelcome()
