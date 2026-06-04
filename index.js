function readmeToHtml(text, imgUrl) {
	let html = '';
	let inCode = false;
	let listType = '';

	text = text
		.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))
		.replace(/!\[(.*?)\]\((.*?)\)/g, (m, alt, src) =>
			`<figure class="figure"><img src="${imgUrl + src}" alt="${alt}"><figcaption>${alt}</figcaption></figure>`)
		.replace(/\[(.*?)\]\((.*?)\)/g, (m, text, url) => `<a href="${url.replace(/&amp;/g, '&')}" target="_blank" rel="noopener">${text}</a>`)
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/`([^`\n]+)`/g, '<code>$1</code>')
		.replace(/\\[\r\n]+/g, '<br>');

	const lines = (text + '\n')	.split(/\r?\n/);

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		if (line.startsWith('```')) {
			html += inCode ? '</code></pre>' : '<pre><code>';
			inCode = !inCode;

			continue;
		} else if (inCode) {
			line = line.replace(/(".*?"|'.*?')/g, '<span class="code-highlight-string">$&</span>');
			line = line.replace(/\b(\d+)\b/g, '<span class="code-highlight-number">$1</span>');
			line = line.replace(/\b([A-Za-z0-9_]+)(\s*)\(/g, '<span class="code-highlight-keyword">$1</span>$2(');
			html += line + '\n';

			continue;
		}

		const isList = /^\s*[-*]\s+/.test(line);
		const isNumList = /^\s*\d+\.\s+/.test(line);
		if (isList || isNumList) {
			let newType = isNumList ? 'ol' : 'ul';

			if (listType !== newType) {
				if (listType !== '') html += `</${listType}>`;
				listType = newType;

				if (isNumList) {
					const numberMatch = line.match(/^\s*(\d+)\.\s+/);
					if (numberMatch && numberMatch[1] !== '1')
						newType += ` start="${numberMatch[1]}"`;
				}

				html += `<${newType}>`;
			}

			html += '<li>' + line.replace(/^\s*(?:\d+\.|[-*])\s+/, '') + '</li>';

			continue;
		}

		if (listType !== '') {
			html += `</${listType}>`;
			listType = '';
		}

		if (!line.trim())
			continue;

		const header = line.match(/^(#{1,6})\s+(.*)$/);
		if (header) {
			html += `<h${header[1].length}>${header[2]}</h${header[1].length}>`;
			continue;
		}

		if (line.includes('|') && lines[i+1] && lines[i+1].includes('---')) {
			html += '<table><thead><tr>' + line.split('|').filter(c => c.trim()).map(h => `<th>${h.trim()}</th>`).join('') + '</tr></thead><tbody>';
			i++;

			while (lines[i+1] && lines[i+1].includes('|'))
				html += '<tr>' + lines[++i].split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';

			html += '</tbody></table>';

			continue;
		}

		html += `<p>${line}</p>`;
	}

	return html;
}

async function loadArticle(el, project, file = 'README.md') {
	const url = (project === '') ? '' :'https://raw.githubusercontent.com/stassafuae/' + project + '/main/';
	const text = await fetch(url + file).then(r => r.text());

	let html = readmeToHtml(text, url);
	if (project !== '')
		html += '<br><a href="https://github.com/stassafuae/' + project + '" target="_blank" rel="noopener">Source: GitHub</a>';

	document.getElementById("article").innerHTML = html;
	document.querySelector(".content").scrollTop = 0;
	document.querySelectorAll(".nav div").forEach(a => a.classList.remove("active"));

	if (el)
		el.classList.add("active");
}


loadArticle(null, '');
