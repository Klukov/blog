(function renderPosts() {
  const list = window.posts || [];
  const grid = document.getElementById("posts-grid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach((post, index) => {
    const number = String(list.length - index).padStart(2, "0");
    const a = document.createElement("a");
    a.className = "card";
    a.href = post.path;
    a.setAttribute("role", "listitem");
    a.innerHTML = `
      <div class="card-accent" aria-hidden="true"></div>
      <span class="card-number" aria-hidden="true">${number}</span>
      <div class="card-body">
        <h3>${post.title}</h3>
        <p>${post.description || ""}</p>
      </div>
    `;
    grid.appendChild(a);
  });
})();

