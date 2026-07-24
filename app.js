let allChannels = [];

document.addEventListener('DOMContentLoaded', () => {
    // হেডার সেকশন যোগ করা
    updateHomeHeader();

    // স্প্ল্যাশ স্ক্রিন রিমুভ করার নিরাপদ কোড
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.transition = 'opacity 0.5s ease';
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }
    }, 1500);

    if (!document.getElementById('hlsScript')) {
        const script = document.createElement('script');
        script.id = 'hlsScript';
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        document.head.appendChild(script);
    }

    loadM3UChannels();
    setupNavigation();
});

// হোম স্ক্রিনে টিভি আইকন এবং Hridoytv 2.0 টেক্সট যোগ করার ফাংশন
function updateHomeHeader() {
    let existingHeader = document.getElementById('customAppHeader');
    if (existingHeader) existingHeader.remove();

    const headerContainer = document.createElement('div');
    headerContainer.id = 'customAppHeader';
    headerContainer.style.cssText = 'text-align: center; padding: 12px 10px; background: #0f2514; border-bottom: 1px solid #1b5e20; margin-bottom: 10px; width: 100%;';
    
    headerContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
            <div style="font-size: 24px; background: #1b5e20; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,230,118,0.3);">📺</div>
            <h1 style="font-size: 15px; color: #00e676; margin: 0; font-weight: bold; letter-spacing: 0.5px;">Hridoytv 2.0</h1>
        </div>
    `;

    const grid = document.getElementById('channelGrid');
    if (grid && grid.parentNode) {
        grid.parentNode.insertBefore(headerContainer, grid);
    } else {
        document.body.prepend(headerContainer);
    }
}

async function loadM3UChannels() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/shidul100/Iptv/refs/heads/main/playlist.m3u');
        const m3uText = await response.text();
        
        allChannels = parseM3U(m3uText);
        displayChannels(allChannels);
        setupCategoryFilters();
    } catch (error) {
        console.error('চ্যানেল লোড করতে সমস্যা:', error);
        const grid = document.getElementById('channelGrid');
        if (grid) {
            grid.innerHTML = '<p style="color:#ff5252; text-align:center; grid-column: 1/-1;">চ্যানেল লোড করা যায়নি।</p>';
        }
    }
}

function parseM3U(m3u) {
    const lines = m3u.split('\n');
    const channels = [];
    let currentChannel = {};

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            currentChannel = {};
            
            let nameMatch = line.match(/tvg-name="([^"]*)"/);
            if (!nameMatch) {
                let parts = line.split(',');
                currentChannel.channel_name = parts[parts.length - 1].trim();
            } else {
                currentChannel.channel_name = nameMatch[1];
            }

            let logoMatch = line.match(/tvg-logo="([^"]*)"/);
            currentChannel.logo_url = logoMatch ? logoMatch[1] : 'https://i.ibb.co.com/HTKB1b63/logo.jpg';
            
            let groupMatch = line.match(/group-title="([^"]*)"/);
            currentChannel.category = groupMatch ? groupMatch[1].trim().toLowerCase() : 'all';
            
        } else if (line && !line.startsWith('#')) {
            currentChannel.stream_url = line;
            if (currentChannel.channel_name && currentChannel.stream_url) {
                channels.push(currentChannel);
            }
        }
    }
    return channels;
}

function displayChannels(channels) {
    const grid = document.getElementById('channelGrid');
    if (!grid) return;
    
    grid.innerHTML = ''; 

    if (channels.length === 0) {
        grid.innerHTML = '<p style="color:#a5d6a7; text-align:center; grid-column: 1/-1; margin-top:20px;">কোনো চ্যানেল পাওয়া যায়নি</p>';
        return;
    }

    channels.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'channel-card';

        card.innerHTML = `
            <div class="channel-logo-container">
                <img src="${channel.logo_url}" alt="${channel.channel_name}" class="channel-logo" onerror="this.onerror=null; this.src='https://i.ibb.co.com/HTKB1b63/logo.jpg';">
            </div>
            <span class="channel-name">${channel.channel_name}</span>
        `;

        card.addEventListener('click', () => {
            openVideoPlayer(channel);
        });

        grid.appendChild(card);
    });
}

function setupCategoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category').toLowerCase();

            if (category === 'all' || category === 'pinned') {
                displayChannels(allChannels);
            } else {
                const filtered = allChannels.filter(ch => {
                    return ch.category.includes(category);
                });
                displayChannels(filtered);
            }
        });
    });
}

function openVideoPlayer(channel) {
    const existingPlayer = document.getElementById('videoPlayerModal');
    if (existingPlayer) existingPlayer.remove();

    let streamUrl = channel.stream_url;
    let isYoutube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be');
    
    if (isYoutube) {
        if (streamUrl.includes('watch?v=')) {
            streamUrl = streamUrl.replace('watch?v=', 'embed/');
        } else if (streamUrl.includes('youtu.be/')) {
            streamUrl = streamUrl.replace('youtu.be/', 'www.youtube.com/embed/');
        }
    }

    const playerHTML = `
        <div id="videoPlayerModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 30, 15, 0.95); z-index: 2000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5px;">
            <div style="width: 100%; max-width: 600px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; color: #fff; padding: 0 5px;">
                <h3 style="font-size: 14px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;">📺 ${channel.channel_name}</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button id="forceFullScreenBtn" style="background: #00e676; color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">ফুল স্ক্রিন</button>
                    <span id="closePlayerBtn" style="font-size: 16px; cursor: pointer; background: #1b5e20; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff;">✕</span>
                </div>
            </div>
            
            <div id="playerWrapper" style="width: 100%; max-width: 600px; aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 25px rgba(0, 230, 118, 0.2); display: flex; align-items: center; justify-content: center; position: relative; border: 1px solid #1b5e20;">
                ${isYoutube 
                    ? `<iframe id="tvIframe" src="${streamUrl}?autoplay=1" style="width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                    : `<video id="tvVideoElement" controls autoplay playsinline style="width: 100%; height: 100%; background: #000; object-fit: contain;"></video>`
                }
                <div id="loadingIndicator" style="position: absolute; color: #00e676; font-size: 13px; background: rgba(10, 30, 15, 0.9); padding: 6px 12px; border-radius: 4px; border: 1px solid #2e7d32;">চ্যানেল লোড হচ্ছে...</div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);

    const loader = document.getElementById('loadingIndicator');

    if (!isYoutube) {
        const videoElement = document.getElementById('tvVideoElement');
        
        videoElement.addEventListener('playing', () => {
            if (loader) loader.style.display = 'none';
        });

        videoElement.addEventListener('error', () => {
            if (loader) loader.innerHTML = 'স্ট্রিমটি লোড করা সম্ভব হচ্ছে না!';
            loader.style.color = '#ff5252';
        });

        if (streamUrl.includes('.m3u8')) {
            if (window.Hls && Hls.isSupported()) {
                const hls = new Hls({
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    liveSyncDurationCount: 3,
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(videoElement);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoElement.play().catch(() => {});
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                if (loader) loader.innerHTML = 'চ্যানেলটি অফলাইন বা অনুপলব্ধ';
                                loader.style.color = '#ff5252';
                                break;
                        }
                    }
                });
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = streamUrl;
                videoElement.addEventListener('loadedmetadata', () => {
                    videoElement.play().catch(() => {});
                });
            }
        } else {
            videoElement.src = streamUrl;
            videoElement.play().catch(() => {});
        }
    } else {
        if (loader) loader.style.display = 'none';
    }

    document.getElementById('closePlayerBtn').addEventListener('click', () => {
        document.getElementById('videoPlayerModal').remove();
    });

    const triggerFullScreen = () => {
        const playerWrapper = document.getElementById('playerWrapper');
        const videoEl = document.getElementById('tvVideoElement');
        const targetElement = videoEl || playerWrapper;

        if (targetElement.requestFullscreen) {
            targetElement.requestFullscreen();
        } else if (targetElement.webkitRequestFullscreen) {
            targetElement.webkitRequestFullscreen();
        } else if (targetElement.msRequestFullscreen) {
            targetElement.msRequestFullscreen();
        } else if (targetElement.webkitEnterFullscreen) { 
            targetElement.webkitEnterFullscreen();
        }
    };

    document.getElementById('forceFullScreenBtn').addEventListener('click', triggerFullScreen);
    
    const activeVideo = document.getElementById('tvVideoElement');
    if (activeVideo) {
        activeVideo.addEventListener('dblclick', triggerFullScreen);
    }

    document.getElementById('videoPlayerModal').addEventListener('click', (e) => {
        if (e.target.id === 'videoPlayerModal') {
            e.target.remove();
        }
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    
    navItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const grid = document.getElementById('channelGrid');

            switch(index) {
                case 0:
                    setActiveNav(navItems, 0);
                    displayChannels(allChannels);
                    break;
                case 1:
                    window.location.href = "https://github.com/princehridoyk75-bit/Hridoytv2.0/raw/main/app-release.apk"; 
                    break;
                case 2:
                    setActiveNav(navItems, 2);
                    if(grid) grid.innerHTML = '<div style="text-align:center; padding:40px; color:#00e676; grid-column:1/-1;"><h3>HridoyTV Portal</h3><p style="color:#a5d6a7;">লাইভ টিভি পোর্টাল এবং অফিশিয়াল ওয়েবসাইট।</p></div>';
                    break;
                case 3:
                    setActiveNav(navItems, 3);
                    if(grid) showSearchBox(grid);
                    break;
                case 4:
                    showMenuPopup();
                    break;
            }
        });
    });
}

function setActiveNav(navItems, activeIndex) {
    navItems.forEach((nav, idx) => {
        if(idx === activeIndex) nav.classList.add('active');
        else nav.classList.remove('active');
    });
}

function showMenuPopup() {
    const existingMenu = document.getElementById('menuPopupModal');
    if (existingMenu) existingMenu.remove();

    const menuHTML = `
        <div id="menuPopupModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 30, 15, 0.8); z-index: 1000; display: flex; align-items: flex-end; justify-content: center;">
            <div style="background: #0f2514; width: 100%; max-width: 480px; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 20px; color: #fff; border-top: 2px solid #1b5e20;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1b5e20; padding-bottom: 10px;">
                    <span style="font-size: 13px; color: #a5d6a7; font-weight: bold;">MENU</span>
                    <span id="closeMenuBtn" style="font-size: 20px; cursor: pointer; color: #a5d6a7;">✕</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; max-height: 65vh; overflow-y: auto;">
                    <a href="#" style="padding: 12px 10px; color: #e8f5e9; text-decoration: none; border-bottom: 1px solid #14361b;">ℹ️ About Us</a>
                    <a href="#" style="padding: 12px 10px; color: #e8f5e9; text-decoration: none; border-bottom: 1px solid #14361b;">✉️ Contact Us</a>
                    <a href="https://github.com/princehridoyk75-bit" target="_blank" style="padding: 12px 10px; color: #e8f5e9; text-decoration: none;">🐙 Our GitHub</a>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    document.getElementById('closeMenuBtn').addEventListener('click', () => document.getElementById('menuPopupModal').remove());
}

function showSearchBox(grid) {
    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 5px 0;">
            <input type="text" id="searchInput" placeholder="চ্যানেল খুঁজুন..." style="width: 100%; padding: 10px 15px; border-radius: 20px; border: 1px solid #2e7d32; background: #0f2514; color: #fff; outline: none;">
        </div>
        <div id="searchResults" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; grid-column: 1/-1;"></div>
    `;
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    displayChannelsInGrid(allChannels, searchResults);

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = allChannels.filter(ch => ch.channel_name.toLowerCase().includes(keyword));
        displayChannelsInGrid(filtered, searchResults);
    });
}

function displayChannelsInGrid(channels, container) {
    container.innerHTML = '';
    if (channels.length === 0) {
        container.innerHTML = '<p style="color:#a5d6a7; text-align:center; grid-column: 1/-1;">কিছু পাওয়া যায়নি</p>';
        return;
    }
    channels.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-logo-container"><img src="${channel.logo_url}" class="channel-logo" onerror="this.onerror=null; this.src='https://i.ibb.co.com/HTKB1b63/logo.jpg';"></div>
            <span class="channel-name">${channel.channel_name}</span>
        `;
        card.addEventListener('click', () => openVideoPlayer(channel));
        container.appendChild(card);
    });
                                            }
