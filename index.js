
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// HandleRequest function will handle the request
// Fetch function will get the response from the specified url 
// If the URL in invalid, Page will "no content from the fetch api" will be popped up
async function handleRequest(request) {
  let url = 'https://cfw-takehome.developers.workers.dev/api/variants';
  let response = await fetch(url);

  if (response.ok) {
    let json = await response.json();
    let urls = json.variants;
    return await ABTesting(request, urls)
  } else {
    return new Response('No content from the fetch api', {
      headers: { 'content-type': 'text/plain' },
    })
  }
}
// Below function will return each variant around 50% of the time.
async function ABTesting(request, urls) {
  const NAME = 'experiment'
  const cookie = request.headers.get('cookie')
  if (cookie && cookie.includes(`${NAME}=control`)) {
    return await returnResponse(urls, true)
  } else if (cookie && cookie.includes(`${NAME}=test`)) {
    return await returnResponse(urls, false)
  } else {
    let group = Math.random() < 0.5 ? 'test' : 'control' // 50/50 split
    let response = group === 'control' ? await returnResponse(urls, true) : await returnResponse(urls, false)
    response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`)
    return response
  }
}
// It will return HTML reponse based on the url
async function returnResponse(urls, flag) {
  if (flag) {
    let response = await fetch(urls[0]);
    return new HTMLRewriter().on('*', new ElementHandler(flag)).transform(response)
  } else {
    let response = await fetch(urls[1]);
    return new HTMLRewriter().on('*', new ElementHandler(flag)).transform(response)
  }
}

// Function will change title, href, etc tags as mentioned in the github repo
class ElementHandler {

  constructor(flag) {
    self.flag = flag
  }
  element(element) {
    if (element.tagName == 'title') {
      if (self.flag) { element.setInnerContent("Amit Page 1") }
      else { element.setInnerContent("Amit Page 2") }
    }
    else if (element.tagName == 'a') {
      if (element.getAttribute('id') == 'url') {
        if (self.flag) {
          element.setInnerContent("Go to my Github Profile")
          element.setAttribute('href', 'https://www.github.com/Amit80007/')
        } else {
          element.setInnerContent("Go to my Linkedin Profile")
          element.setAttribute('href', 'https://www.linkedin.com/in/garg-amit/')
        }
      }
    }
    else if (element.tagName == 'h1') {
      if (element.getAttribute('id') == 'title') {
        if (self.flag) element.setInnerContent("Amit's Inner Header-1")
        else element.setInnerContent("Amit's Inner Header-2")
      }
    }

    if (element.tagName == 'p') {
      if (element.getAttribute('id') == 'description') {
        if (self.flag) element.setInnerContent("This is Amit's variant one")
        else element.setInnerContent("This is Amit's variant two")
      }
    }
  }
}
