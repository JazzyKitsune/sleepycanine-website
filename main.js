const PARAMS = new URLSearchParams(window.location.search);

    function get_system_name(system_id) {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          let t = this.responseText;
          build_website_from_system(JSON.parse(t));
        }
        if (this.readyState === 4 && this.status === 404) {
          build_website_system_404(system_id);
        }
      };
      xhttp.open("GET", `https://api.pluralkit.me/v2/systems/${system_id}`, false);
      xhttp.send(null);
    }

    function build_website_system_404(system_id) {
      let ele = document.getElementById("system-desc");
      ele.innerText = `System with ID "${system_id}" not found. Please tweak the URL and try again.`;
      ele = document.getElementById("system-name");
      ele.innerText = "System not found";
    }

    function build_website_from_system(data) {
      document.getElementById("system-name").innerText = escapeHtml(data.name + " " + (data.tag ? data.tag : ""));
      document.getElementById("system-desc").innerHTML = render_markdown(data.description || "");
      let header = document.getElementById("header");
      header.dataset['colour'] = `#${data.color || '36393e'}`;
      document.getElementById("page").style['background-color'] = header.dataset['colour'];
      document.getElementById("body").style['background-color'] = header.dataset['colour']
      // Get system members

      if (PARAMS.get("g")) {

        for (let group of PARAMS.get("g").split(",")) {
          append_group_section(group);
        }

      } else {

        document.getElementById("footer").style['background-color'] = header.dataset['colour'];
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState === 4 && this.status === 200) {
            let t = this.responseText;
            let ele = make_member_section("page", JSON.parse(t));
            document.getElementById("page").appendChild(ele);
          }
        };
        xhttp.open("GET", `https://api.pluralkit.me/v2/systems/${data.id}/members`, false);
        xhttp.send(null);

      }
    }

    function append_group_section(group_id) {

      // Append a group section here
      let group_html = `
        <div class="text-black" id="${group_id}" data-colour="#36393e">
          <div id="${group_id}-bg">
            <div class="p-1 card bg-light" style="margin-right:calc(15px + .25em); margin-left:calc(15px + .25em)" id="${group_id}-header">
              <div class="card-title" id="${group_id}-name"></div>
              <div class="card-text" id="${group_id}-desc"></div>
            </div>
          </div>
        </div>`;
      let wrapper = document.createElement("div");
      wrapper.innerHTML = group_html;
      console.log(wrapper, wrapper.firstElementChild);
      document.getElementById("body").appendChild(wrapper.firstElementChild);

      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          let t = this.responseText;
          build_group_section(group_id, JSON.parse(t));
        }
        if (this.readyState === 4 && this.status === 404) {
          document.getElementById(`${group_id}-name`).innerText = "Group not found.";
          document.getElementById(`${group_id}-desc`).innerText = `Group with ID "${group_id}" not found. Please tweak the URL and try again.`;
        }
      };
      xhttp.open("GET", `https://api.pluralkit.me/v2/groups/${group_id}`, false);
      xhttp.send(null);
    }

    function escapeHtml(unsafe) {
      return unsafe.replaceAll("&", "&amp;")
                   .replaceAll("<", "&lt;")
                   .replaceAll(">", "&gt;")
                   .replaceAll('"', "&quot;")
                   .replaceAll("'", "&#039;")
    }

    function render_markdown(content) {
      content = escapeHtml(content);
      return content.replaceAll(/\|\|([^|]+)\|\|/g, '<span class="spoiler">$1</span>')
                    .replaceAll(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
                    .replaceAll(/\b__(.+?)__\b/g, '<u>$1</u>')
                    .replaceAll(/\*([^*]+)\*/g, '<i>$1</i>')
                    .replaceAll(/\b_(.+?)_\b/g, '<i>$1</i>')
                    .replaceAll(/~~([^~]+)~~/g, '<s>$1</s>')
                    .replaceAll(/\[(.*?)]\((?:&lt;)?(https?:\/\/\S+?)(?:&gt;)?\)/gi, '<a href="$2">$1</a>')
                    .replaceAll("\n", "<br/>")
                    .replaceAll(/\\(\W)/g, "$1");
    }

    function build_group_section(id, data) {
      document.getElementById(`${id}-name`).innerText = escapeHtml(data.display_name || data.name0);
      document.getElementById(`${id}-desc`).innerHTML = render_markdown(data.description || "");
      let ele = document.getElementById(`${id}`);
      ele.dataset['colour'] = `#${data.color || '36393e'}`
      let sibling = ele.previousElementSibling;
      console.log(ele, sibling)
      document.getElementById(`${id}-bg`).style['background-image'] = `linear-gradient(${sibling.dataset['colour']}, ${ele.dataset['colour']})`
      // The dom-body needs to be the same colour as the last group
      document.getElementById("footer").style['background-color'] = ele.dataset['colour'];

      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          let t = this.responseText;
          let ele = make_member_section(id, JSON.parse(t));
          document.getElementById(id).appendChild(ele);
        }
      };
      xhttp.open("GET", `https://api.pluralkit.me/v2/groups/${id}/members`, false);
      xhttp.send(null);

    }

    function make_member_section(parent, member_list) {
      let container = document.createElement("div");
      container.className = "body container-fluid d-inline-flex flex-wrap";
      container.id = `${parent}-members`;
      document.getElementById(parent).appendChild(container);
      container.style['background-color'] = document.getElementById(parent).dataset['colour'];

      for (let member of member_list) {
        let description = render_markdown(member.description || "");
        let proxy = ""
        for (let p of member.proxy_tags) {
          if (p['prefix'] && !p['suffix']) {
            proxy = p['prefix'];
            break;
          } else if (p['prefix'] && p['suffix']) {
            proxy = `${p['prefix']}...${p['suffix']}`;
            break;
          }
        }
        proxy = escapeHtml(proxy);
        let pronouns = member.pronouns !== null ? `<div class="card-subtitle text-muted">${render_markdown(member.pronouns)}</div>` : "";
        let block = document.createElement("div");
        block.innerHTML = `
          <div class="m-1" style="background-color:white; border-radius:.25rem">
            <div class="card p-1" style="width:16rem; border:1px solid #${member.color}; background-color:#${member.color}40">
              <img src="${member.avatar_url}" alt="${escapeHtml(member.name)}" class="card-img" />
              <div class="card-body">
                <div class="card-title d-flex justify-content-between">
                  <div>${escapeHtml(member.display_name || member.name)}</div>
                  <div class="discord-mono">${proxy}</div>
                </div>
                ${pronouns}
                <div class="card-text">${description}</div>
              </div>
            </div>
          </div>`;
        container.appendChild(block);
      }

      return container;
    }

    function build_system_getter() {
      let ele = document.getElementById("system-desc");
      ele.innerHTML = `
        <p>No system given. Enter a system ID or discord ID here:</p>
        <form method="get" class="form-inline">
          <label for="s" class="sr-only">System ID</label>
          <input class="form-control mb-2 mr-sm-2" type="text" id="s" name="s" placeholder="System ID"/>
          <button class="form-control mb-2" type="submit">Load system.</button>
        </form>
        <p>Alternatively, add "?s=MY_SYSTEM_ID" to the URL.</p>
        <p>To add different groups, you can also add "&g=MY,GROUP,LIST" to the URL after the s=.</p>`;
      ele = document.getElementById("system-name");
      ele.innerText = "No system specified";
    }

    if (PARAMS.get("s"))
      get_system_name(PARAMS.get("s"));
    else
      build_system_getter();
