# Technologies

- At it's core, a bot is a backend request-response based server
  - Requests come in form of messages from user
  - Responds with one or more messages to user
    - Rich text, images, whatnots
  - Session consists of chat context and history
- Authentication usually through chat network user account

---

## Bot connector

- Microsoft service for connecting your bot server to multiple chat networks
- Also provides discovery of new bots
- Probably some Cortana integrations in the future

---


## Cognitive services

To make your bots more powerful, MS also provides some [*cognitive services*](https://www.microsoft.com/cognitive-services/) that you can use to drive the interaction:
- **Vision APIs** to analyze images and video
- **Speech APIs** to understand and generate spoken words
- **Language APIs** to understand and analyze natural language
- **Knowledge APIs**, like Wolfram Alpha i guess
- **Search APIs** to find stuff on the web (Bing)


---

## Bot service architecture

![Architecture diagram](http://yuml.me/dadafd12)
