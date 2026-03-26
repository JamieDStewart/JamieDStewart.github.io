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
    Object.keys(categories).sort().forEach(cat => {
      const catDiv = document.createElement('div')
      catDiv.innerHTML = `<h3 class="category-header expanded">${cat}</h3>`
      const ul = document.createElement('ul')
      ul.className = 'category-list'
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
        ul.classList.toggle('collapsed')
        h3.classList.toggle('expanded')
      })
    })
  })
