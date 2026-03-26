function formatTitle(name) {
  return name
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/-/g, " ")
    .replace(/\.md$/, "")
    .replace(/\b\w/g, c => c.toUpperCase())
}

fetch("/_posts/index.json")
  .then(r => r.json())
  .then(files => {
    const nav = document.querySelector(".nav")
    files.forEach(file => {
      const a = document.createElement("a")
      a.href = "/posts/post.html?name=" + file
      a.textContent = formatTitle(file)
      nav.appendChild(a)
    })
  })
