const params = new URLSearchParams(location.search)
const name = params.get("name")

fetch("/_posts/" + name)
  .then(r => r.text())
  .then(md => {
    const el = document.getElementById("post")
    el.textContent = md
    window.markdeep.formatFragment(el.parentElement)
  })
