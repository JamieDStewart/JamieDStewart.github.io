function getCurrentCategory() {
  const params = new URLSearchParams(window.location.search)
  const name = params.get("name")
  if (!name) return null
  const parts = name.split('-')
  return parts[3] || null
}


fetch("/_posts/index.json")
  .then(r => r.json())
  .then(files => {
    const categories = {}
    files.forEach(file => {
      const parts = file.split('-')
      const date = parts.slice(0, 3).join('-')
      const category = parts[3]
      const titleParts = parts.slice(4)
      titleParts[titleParts.length - 1] = titleParts[titleParts.length - 1].replace(/\.md$/, '')
      const title = titleParts.join(' ').replace(/\b\w/g, c => c.toUpperCase())
      if (!categories[category]) categories[category] = []
      categories[category].push({ file, date, title })
    })

    const nav = document.querySelector(".nav")

    const currentCategory = getCurrentCategory()

    Object.keys(categories).sort().forEach(cat => {
      const catDiv = document.createElement('div')
      const isCurrent = (cat === currentCategory)

      catDiv.innerHTML = `<h3 class="category-header ${isCurrent ? 'expanded' : ''}">${cat}</h3>`
      
      const ul = document.createElement('ul')
      ul.className = 'category-list'
      if (isCurrent) ul.classList.add('expanded')
      categories[cat].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(post => {
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.href = "/posts/post.html?name=" + post.file
        a.textContent = post.title
        li.appendChild(a)
        ul.appendChild(li)
      })
      catDiv.appendChild(ul)
      nav.appendChild(catDiv)

      // Add click handler for collapsing
      const h3 = catDiv.querySelector('.category-header')
      h3.addEventListener('click', () => {
        // Close all other categories
        document.querySelectorAll('.category-list').forEach(list => {
          if (list !== ul) list.classList.remove('expanded')
        })
        document.querySelectorAll('.category-header').forEach(header => {
          if (header !== h3) header.classList.remove('expanded')
        })

        // Toggle the clicked one
        ul.classList.toggle('expanded')
        h3.classList.toggle('expanded')
      })
    })
  })
