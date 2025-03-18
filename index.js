require('dotenv').config()
const express = require('express')
const app = express()
const port = 4000

const github = {
  "login": "mesidd",
  "id": 160341360,
  "node_id": "U_kgDOCY6dcA",
  "avatar_url": "https://avatars.githubusercontent.com/u/160341360?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/mesidd",
  "html_url": "https://github.com/mesidd",
  "followers_url": "https://api.github.com/users/mesidd/followers",
  "following_url": "https://api.github.com/users/mesidd/following{/other_user}",
  "gists_url": "https://api.github.com/users/mesidd/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/mesidd/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/mesidd/subscriptions",
  "organizations_url": "https://api.github.com/users/mesidd/orgs",
  "repos_url": "https://api.github.com/users/mesidd/repos",
  "events_url": "https://api.github.com/users/mesidd/events{/privacy}",
  "received_events_url": "https://api.github.com/users/mesidd/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": "Siddhartha Sharma",
  "company": null,
  "blog": "",
  "location": null,
  "email": null,
  "hireable": null,
  "bio": "Enjoy solving problems related to technology and Science. Enhancing skills to solve more problems.",
  "twitter_username": "philfans_",
  "public_repos": 8,
  "public_gists": 0,
  "followers": 1,
  "following": 4,
  "created_at": "2024-02-17T16:31:49Z",
  "updated_at": "2025-03-04T16:34:57Z"
}
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/blogs',(req,res)=> {
  res.send("Ready to read blogs")
})

app.get('/login',(req,res)=> {
  res.send('<h1>Hello</h1>')
})

app.get('/github',(req,res)=>{
  res.send(github)
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${port}`)
})

