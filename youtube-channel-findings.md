# YouTube Channel Findings

Source: https://www.youtube.com/@TheMukhmalShow

The public channel is titled **The Mukhmal Show**, handle **@TheMukhmalShow**, and the page currently shows **82 subscribers** and **18 videos**. The channel description reads: “ज़िंदगी के गहरे सच और प्रेरणादायक सीख — जो आपको अंदर तक झकझोर देंगी।”

The channel currently exposes a Shorts-focused public feed. Verified public Shorts include:

| Video ID | Title | Public URL |
|---|---|---|
| hxII7UPfxx4 | कुछ लोग जिंदगी में क्यों आते हैं?💔 | https://www.youtube.com/shorts/hxII7UPfxx4 |
| Ef49xWnSKYI | कुछ लोग जिंदगी में क्यों आते हैं? 💔 | https://www.youtube.com/shorts/Ef49xWnSKYI |
| lisv10zee5A | कदर नहीं तो रिश्ता खत्म! 😤 | https://www.youtube.com/shorts/lisv10zee5A |
| rYcMxdltLq0 | ज़रूरत ख़त्म, लोग ख़त्म! 💔 | https://www.youtube.com/shorts/rYcMxdltLq0 |
| FT4FXe31x-M | क्यों हम किसी को भूल नहीं पाते? 💔 | https://www.youtube.com/shorts/FT4FXe31x-M |
| -v7sYAfXR-U | एक इंसान, पूरी जिंदगी का बदलाव ✨ | https://www.youtube.com/shorts/-v7sYAfXR-U |
| LLMuZVYZmNs | ये कड़वा सच आपकी आँखें खोल देगा 💔 | https://www.youtube.com/shorts/LLMuZVYZmNs |
| xmE8qK4pooY | ज़िंदगी की 5 कड़वी सच्चाई जो आपको निराश होने से बचाएगी | https://www.youtube.com/shorts/xmE8qK4pooY |
| cPWpwLWUxoE | रिश्ता टूटने से बचाना है? ये 5 बातें जान लो 💔 | https://www.youtube.com/shorts/cPWpwLWUxoE |
| B0MbwWoSGwc | देर होने से पहले ये 5 बातें समझ लो! ⚠️ | https://www.youtube.com/shorts/B0MbwWoSGwc |
| gJ6_F7zTHC0 | ज़िंदगी के 5 कड़वे सच, जो हर किसी को पता होने चाहिए 💯 | https://www.youtube.com/shorts/gJ6_F7zTHC0 |
| v188NkhMQcE | ज़िंदगी के सच हमें अंदर तक झकझोरते हैं | https://www.youtube.com/shorts/v188NkhMQcE |
| WY8g_nr8pw8 | Future Ready Bano: AI Abhi Seekho! 🚀 | https://www.youtube.com/shorts/WY8g_nr8pw8 |
| kavc7FplXFk | फेस-टु-फेस बातें अब लज़री हैं | https://www.youtube.com/shorts/kavc7FplXFk |
| cRMem6evr0k | रिश्ते टूटते हैं शब्दों से नहीं, लहज़े से | https://www.youtube.com/shorts/cRMem6evr0k |
| cyChEbfvVxc | Targeted Ads का असली सच जो Companies छुपाती हैं | https://www.youtube.com/shorts/cyChEbfvVxc |

Implementation decision: use public YouTube thumbnail URLs (`https://i.ytimg.com/vi/{VIDEO_ID}/hqdefault.jpg`) and direct Shorts/watch links for a static, credential-free integration. Add a “View all on YouTube” link to the channel. This avoids exposing a YouTube API key. A future backend/API integration can make the list auto-refresh if the user wants new uploads to appear without code updates.
