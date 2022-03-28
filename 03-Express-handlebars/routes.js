const fs = require('fs')

const requestHandler = (req, res) => {
  console.log(req.url, req.method, req.headers)
  const url = req.url
  const method = req.method
  if (url === '/') {
    res.write('<html>')
    res.write(
      '<body><form action="/message" method="POST"><input type="text" name="message"> <button type="submit">Send</button></input></form> </body>',
    )
    res.write('</html>')
    return res.end()
  }
  if (url === '/message' && method === 'POST') {
    const body = []
    req.on('data', (chunk) => {
      console.log(chunk)
      body.push(chunk)
    })
    return req.on('end', () => {
      const parsedBody = Buffer.concat(body).toString()
      fs.writeFile('message.text', parsedBody.split('=')[1], (err) => {
        res.statusCode = 302
        res.setHeader('Location', '/')
        return res.end()
      })
    })
  }
  res.setHeader('Content-Type', 'text/html')
  res.write('<html>')
  res.write('<body><h1> Hell guys</h1> </body>')
  res.write('</html>')
  res.end()
}

module.exports = requestHandler
