/**
 * The October 2026 packet: what each puzzle page quotes, and what it asks.
 *
 * A page is a scripture reference (its text is looked up, never typed),
 * an `excerpt` of it, word for word, if only part is quoted, and a
 * `question` to think about. Family values: personal responsibility,
 * creativity, courage, self-care, inclusion.
 *
 * Each kind is spread through the packet in the order it's listed here,
 * which is also the order it gets harder in.
 */

export default {
  title: 'General Conference Activity Packet',
  subtitle: 'October 2026',
  intro: 'Conference Talk pages are mixed in between the puzzles. Answers are in a separate answer key, so no peeking!',

  // A page for each talk, mixed in between the puzzles.
  talks: {
    pages: 32,
    sessions: ['Sat AM', 'Sat PM', 'Sun AM', 'Sun PM'],
    fields: ["Speaker's Name", 'Tie / Dress Color', 'Topic', 'A Quote I Liked', 'A Way I Can Apply This Talk in My Life'],
  },

  // Mystery pictures: `picture` is one of lib/puzzles/coord.js's PICTURES.
  coord: [
    {
      picture: 'temple',
      ref: 'D&C 88:119',
      question: "Heavenly Father's house is a house of order. What is one thing you can organize or take care of this week *without being asked*?",
    },
    {
      picture: 'meetinghouse',
      ref: 'D&C 59:9',
      question: 'What is one thing you can do during the sacrament to think about Jesus instead of getting distracted?',
    },
    {
      picture: 'gold-plates',
      ref: '2 Nephi 25:26',
      question: 'Nephi wrote so his children would know where to look for help. If you wrote one page for someone younger than you, what would you want them to know about Jesus?',
    },
    {
      picture: 'missionary-tag',
      ref: 'Matthew 28:19',
      question: "You don't need a name tag to share what you believe. What is a kind, brave way you could tell a friend about something you love about the gospel?",
    },
    {
      picture: 'cross',
      ref: 'John 3:16',
      question: 'God gave His Son because He loves *everyone*. How does it feel to be loved that much? Who could you share that love with this week?',
    },
    {
      picture: 'book-of-mormon',
      ref: '2 Nephi 32:3',
      question: 'To *feast* means to enjoy and take your time. What could make your scripture reading more like a feast and less like a quick snack?',
    },
    {
      picture: 'tablets',
      ref: 'John 14:15',
      question: 'Keeping commandments is a way of showing love. Which commandment is easiest for you, and which one would you like to get better at?',
    },
    {
      picture: 'ark',
      ref: 'Genesis 6:22',
      question: "Noah did what God asked, even when others laughed. When is a time you did the right thing even though it wasn't popular?",
    },
    {
      picture: 'star',
      ref: 'Matthew 2:10',
      question: 'The wise men followed the star and found Jesus. What "stars" (people, scriptures, feelings) help guide you toward Him?',
    },
    {
      picture: 'ctr-shield',
      ref: 'Joshua 24:15',
      excerpt: 'choose you this day whom ye will serve',
      question: "What is a choice you'll face this week where you can *choose the right*? Make a plan now for what you'll do.",
    },
    {
      picture: 'lamp',
      ref: 'D&C 33:17',
      question: 'The wise virgins got ready ahead of time. What is one small daily habit that keeps your "lamp" full?',
    },
    {
      picture: 'dove',
      ref: 'D&C 8:2',
      question: 'The Holy Ghost speaks to your mind and your heart. Think of a time a good thought or a warm feeling helped you. What was it like?',
    },
    {
      picture: 'sheep',
      ref: 'Luke 15:4',
      question: 'The shepherd went after the *one*. Who might feel lost or left out, and how could you go after them?',
    },
    {
      picture: 'tree',
      ref: '1 Nephi 11:22',
      question: 'Lehi wanted his family to taste the fruit with him. What is something good in your life that you want to share with your family?',
    },
    {
      picture: 'lighthouse',
      ref: '3 Nephi 18:24',
      question: "A lighthouse doesn't move. It just keeps shining. How can you be a steady light for someone who is having a hard time?",
    },
  ],

  // Word searches: the verse's own words, bolded in the quote, unless `words` names them; or a `theme`, words of their own, with a `note` saying what they are.
  wordsearch: [
    {
      ref: 'Articles of Faith 1:13',
      title: 'Article of Faith 13',
      words: [
        'believe',
        'honest',
        'true',
        'chaste',
        'benevolent',
        'virtuous',
        'good',
        'admonition',
        'Paul',
        'hope',
        'endure',
        'able',
        'lovely',
        'report',
        'praiseworthy',
        'seek',
        'follow',
        'things',
      ],
      question: "This article says we *seek after* lovely and praiseworthy things. Think of someone you don't usually spend time with. What good thing could you notice about them, and how could you tell them?",
    },
    {
      ref: 'Galatians 5:22-23',
      title: 'Fruit of the Spirit',
      question: 'Which fruit of the Spirit do you see in someone in your family? Tell them this week!',
    },
    {
      ref: 'D&C 4:6',
      title: 'Christlike Attributes',
      question: 'Pick one of these attributes to work on this week. What will you do to practice it each day?',
    },
    {
      ref: '2 Nephi 31:20',
      title: 'Press Forward',
      question: 'Pressing forward means not giving up. What is something hard that you want to keep working at?',
    },
    {
      ref: 'Moroni 7:45',
      title: 'Charity',
      question: 'Charity *is kind* and *envieth not*. When is it hardest for you to be kind? What could help in that moment?',
    },
    {
      ref: 'John 15:12-13',
      title: 'True Friends',
      question: 'What does it mean to be a true friend? What can you do this week to be a better friend to someone?',
    },
    {
      ref: 'Micah 6:8',
      title: 'Walk Humbly',
      question: 'What does *walk humbly with thy God* mean to you? How could you show mercy to someone who made a mistake?',
    },
    {
      ref: 'Matthew 5:14-16',
      title: 'Let Your Light Shine',
      question: "Letting your light shine isn't showing off. It's doing good so others feel God's love. What is one way your light can shine at school?",
    },
    {
      ref: 'Joshua 1:9',
      title: 'Be Strong',
      question: 'God promises to be with you wherever you go. Where do you need courage right now?',
    },
    {
      ref: 'Alma 37:6',
      title: 'Small and Simple',
      question: 'What small and simple thing could you do every day that would make a big difference over time?',
    },
    {
      ref: 'Ether 12:27',
      title: 'Weak Things Made Strong',
      question: "With the Lord's help, weaknesses can become strengths. What is one weakness you'd like His help with?",
    },
    {
      ref: 'Mosiah 18:9',
      title: 'Baptismal Covenant',
      excerpt: 'willing to mourn with those that mourn; yea, and comfort those that stand in need of comfort, and to stand as witnesses of God at all times and in all things, and in all places that ye may be in',
      question: 'At baptism we promise to *mourn with those that mourn*. Who do you know who is sad or struggling, and how could you comfort them?',
    },
    {
      ref: 'Moroni 10:4',
      title: 'Ask God',
      question: 'Moroni promises we can know the truth by asking God. What question would you like to ask Heavenly Father in prayer?',
    },
    {
      ref: '1 Nephi 3:7',
      title: 'I Will Go and Do',
      question: 'Nephi trusted that God would prepare a way. When has something seemed impossible but worked out?',
    },
    {
      ref: 'Psalms 23:1-3',
      title: 'The Good Shepherd',
      question: 'The Shepherd leads His sheep to *still waters* to rest. Where is a quiet place you can go to feel peaceful?',
    },
    {
      ref: 'Matthew 5:7-9',
      title: 'The Beatitudes',
      question: 'Peacemakers help people get along. When is a time you could be a peacemaker at home or with friends?',
    },
    {
      ref: 'Amos 3:7',
      title: 'Latter-day Prophets',
      theme: [
        'Smith',
        'Young',
        'Taylor',
        'Woodruff',
        'Snow',
        'Grant',
        'McKay',
        'Lee',
        'Kimball',
        'Benson',
        'Hunter',
        'Hinckley',
        'Monson',
        'Nelson',
        'Oaks',
      ],
      note: 'Find the last names of the presidents of the Church.',
      question: 'Prophets help us know what God wants us to do today. What did President Oaks or another speaker teach this weekend that you want to remember?',
    },
    {
      ref: 'Alma 37:35',
      title: 'Book of Mormon Heroes',
      theme: [
        'Nephi',
        'Lehi',
        'Sariah',
        'Alma',
        'Mosiah',
        'Benjamin',
        'Abinadi',
        'Ammon',
        'Helaman',
        'Moroni',
        'Mormon',
        'Ether',
        'Enos',
        'Jacob',
        'Samuel',
        'Teancum',
      ],
      question: 'Many Book of Mormon heroes started serving God when they were young. What can you do for Him now, at your age?',
    },
    {
      ref: 'Esther 4:14',
      excerpt: 'who knoweth whether thou art come to the kingdom for such a time as this?',
      title: 'Bible Heroes',
      theme: [
        'Noah',
        'Moses',
        'Esther',
        'Ruth',
        'David',
        'Daniel',
        'Abraham',
        'Sarah',
        'Joseph',
        'Mary',
        'Peter',
        'Paul',
        'Elijah',
        'Samuel',
        'Jonah',
        'Isaac',
      ],
      question: 'Esther was brave when her people needed her. Which Bible hero is your favorite, and what can you learn from their courage?',
    },
    {
      ref: 'D&C 1:38',
      title: 'General Conference',
      theme: [
        'prophet',
        'apostle',
        'covenant',
        'temple',
        'prayer',
        'testimony',
        'atonement',
        'repentance',
        'sacrament',
        'baptism',
        'Savior',
        'faith',
        'gathering',
        'minister',
        'scriptures',
        'Holy Ghost',
      ],
      question: 'When the prophet and apostles speak, it is as if the Lord is speaking. What is one thing you heard this weekend that you want to act on?',
    },
  ],

  // Train tracks: medium, then hard, then expert.
  tracks: [
    {
      ref: 'Proverbs 3:5-6',
      question: "Sometimes the right path isn't obvious, just like in this puzzle. When is a time you needed **courage** to do the right thing before you could see how it would turn out?",
    },
    {
      ref: 'Psalms 119:105',
      question: "God's word is like a flashlight on a dark path. How have the scriptures helped you know what to do next?",
    },
    {
      ref: 'Isaiah 30:21',
      question: 'Have you ever felt a quiet prompting about which way to go? What did you do?',
    },
    {
      ref: 'Proverbs 4:26',
      question: "Planning ahead makes good choices easier. What is one decision you can make *now* so it's easy later?",
    },
    {
      ref: 'Matthew 7:14',
      question: "The right path isn't always the crowded one. How can you stay on it when friends choose differently?",
    },
    {
      ref: '1 Nephi 8:30',
      question: "Holding to the rod means sticking with God's word every day, even in the mist. What helps you hold on?",
    },
    {
      ref: 'Psalms 16:11',
      question: 'Where do you feel the most joy? How might that be connected to being close to God?',
    },
    {
      ref: 'Jeremiah 29:11',
      question: 'God has good plans for you. What is something you hope to become or do when you grow up?',
    },
    {
      ref: 'John 14:6',
      question: 'Jesus is *the way*. What is one thing Jesus did that you want to do more of?',
    },
    {
      ref: 'Hebrews 13:2',
      excerpt: 'Be not forgetful to entertain strangers',
      question: 'Is there someone new at school or church? What could you do to help them feel welcome?',
    },
    {
      ref: 'Isaiah 40:31',
      question: 'When you feel worn out, how can waiting on the Lord (prayer, rest, patience) renew your strength?',
    },
    {
      ref: 'D&C 10:4',
      question: 'Hard puzzles (and hard days) go better with breaks. How can you tell when you need to rest?',
    },
    {
      ref: 'Hebrews 12:1',
      excerpt: 'let us run with patience the race that is set before us',
      question: "Everyone's race is different. How can you cheer others on instead of comparing yourself to them?",
    },
    {
      ref: 'Psalms 32:8',
      question: 'Who are the guides in your life who help you find your way? How could you thank one of them?',
    },
    {
      ref: 'D&C 3:2',
      question: 'God always keeps His promises. How can you be someone people can count on?',
    },
  ],

  // `shape`: rect, heart, word:TEXT, or one of lib/puzzles/maze.js's SHAPES.
  mazes: [
    {
      shape: 'heart',
      ref: 'John 13:34',
      question: 'Jesus loved *everyone*, including people others left out. Who might feel left out at school, church, or on a team? What is one way you can **include** them this week?',
    },
    {
      shape: 'rect',
      ref: 'Philippians 4:13',
      question: "What is something hard you're working on? How could you ask Jesus to strengthen you?",
    },
    {
      shape: 'word:LOVE',
      ref: 'Matthew 22:37-39',
      question: 'Jesus said loving God and loving others are the two greatest commandments. Which one will you focus on this week, and how?',
    },
    {
      shape: 'cross',
      ref: 'Alma 7:11',
      question: "Jesus understands every hard feeling you've ever had. What would you like to tell Him about how you're feeling?",
    },
    {
      shape: 'rect',
      ref: 'Ecclesiastes 9:10',
      excerpt: 'Whatsoever thy hand findeth to do, do it with thy might',
      question: 'Doing something *with thy might* means giving your best effort. What chore or assignment will you do with your best effort this week?',
    },
    {
      shape: 'star',
      ref: 'Matthew 2:2',
      question: 'The wise men traveled a long way to find Jesus. What effort are you willing to make to come closer to Him?',
    },
    {
      shape: 'word:KIND',
      ref: 'Ephesians 4:32',
      question: "Being kind is easy with friends. How can you be kind to someone who isn't kind to you?",
    },
    {
      shape: 'temple',
      ref: 'Psalms 24:3-4',
      excerpt: 'Who shall ascend into the hill of the LORD? or who shall stand in his holy place? He that hath clean hands, and a pure heart',
      question: 'What can you do now to have *clean hands and a pure heart*?',
    },
    {
      shape: 'rect',
      ref: 'Colossians 3:23',
      question: 'Do you work just as hard when no one is watching? What helps you do your best on your own?',
    },
    {
      shape: 'shield',
      ref: 'Ephesians 6:16',
      question: 'What "fiery darts" (temptations, mean words, discouragement) do kids your age face? How does faith protect you?',
    },
    {
      shape: 'word:JESUS',
      ref: 'Helaman 5:12',
      excerpt: 'remember that it is upon the rock of our Redeemer, who is Christ, the Son of God, that ye must build your foundation',
      question: 'A strong foundation helps you stand when storms come. What are you doing to build your foundation on Jesus?',
    },
    {
      shape: 'rect',
      ref: 'Psalms 139:14',
      excerpt: 'I will praise thee; for I am fearfully and wonderfully made',
      question: "Heavenly Father made you unique on purpose. What is something about yourself that you're grateful for?",
    },
    {
      shape: 'heart',
      ref: '3 Nephi 17:21',
      question: 'Jesus blessed the children *one by one*. How does it feel to know He knows you personally? How can you notice people one by one?',
    },
    {
      shape: 'church',
      ref: 'Mosiah 18:21',
      excerpt: 'having their hearts knit together in unity and in love one towards another',
      question: 'How can you help your Primary class or youth group feel more united and welcoming?',
    },
    {
      shape: 'word:HOLY',
      ref: 'Leviticus 19:2',
      excerpt: 'Ye shall be holy: for I the LORD your God am holy',
      question: '*Holy* means set apart for God. What makes Sunday feel different and special in your home?',
    },
    {
      shape: 'rect',
      ref: 'Exodus 35:35',
      excerpt: 'Them hath he filled with wisdom of heart, to work all manner of work',
      question: 'God gives people talents to create beautiful things. What do you love to make or build? How could you use it to bless someone?',
    },
    {
      shape: 'star',
      ref: 'D&C 18:10',
      question: 'Every person is of great worth, including you. How can you show someone that they matter?',
    },
    {
      shape: 'cross',
      ref: 'Isaiah 53:5',
      question: "Because of Jesus, we can be healed and forgiven. Is there someone you need to forgive, or something you'd like to be forgiven for?",
    },
    {
      shape: 'word:FAITH',
      ref: 'Alma 32:21',
      question: "Faith is hoping for things you can't see yet. What is something you have faith in, even though you can't see it?",
    },
    {
      shape: 'rect',
      ref: 'D&C 88:118',
      excerpt: 'seek ye out of the best books words of wisdom; seek learning, even by study and also by faith',
      question: 'What have you been wanting to learn about? How could you start learning it this month?',
    },
    {
      shape: 'book',
      ref: '2 Timothy 3:15',
      question: 'Which scripture story is your favorite? Why does it matter to you?',
    },
    {
      shape: 'temple',
      ref: 'Isaiah 2:3',
      question: 'The temple is where we learn to walk in His paths. What is one thing you can do *now*, on your own, to get ready to go to the temple?',
    },
    {
      shape: 'rect',
      ref: 'Psalms 96:1',
      question: 'Creating can be a way to worship. If you made up a song, drawing, or story about Jesus, what would it be about?',
    },
    {
      shape: 'word:HOPE',
      ref: 'Romans 15:13',
      question: 'What gives you hope when things are hard? How can you share hope with a friend who feels down?',
    },
    {
      shape: 'rect',
      ref: 'Galatians 6:9',
      question: 'Mazes take patience! What good thing are you waiting to see results from? How can you keep going?',
    },
  ],

  // Sudoku: medium, then hard, then expert.
  sudoku: [
    {
      ref: 'Mosiah 4:27',
      question: 'Sudoku works best one step at a time, not all at once. What helps you **recharge** when you feel tired or overwhelmed? When can you make time for it this week?',
    },
    {
      ref: 'D&C 58:27',
      question: "You don't have to wait to be told to do good. What good thing could you start on your own this week?",
    },
    {
      ref: 'James 1:22',
      question: 'Pick one thing you heard at conference. How will you *do* it, not just hear it?',
    },
    {
      ref: 'Luke 2:52',
      question: 'Jesus grew in four ways: mind, body, spirit, and friendships. Which one do you want to grow in this month?',
    },
    {
      ref: '1 Timothy 4:12',
      question: 'You can be an example even as a kid. Who might be watching you, like a younger sibling or cousin?',
    },
    {
      ref: 'Alma 34:32',
      excerpt: 'this life is the time for men to prepare to meet God',
      question: 'What is one thing you can do today that your future self will thank you for?',
    },
    {
      ref: 'Proverbs 15:1',
      question: 'When someone is upset with you, how could a soft answer change what happens next?',
    },
    {
      ref: '1 Samuel 16:7',
      excerpt: 'for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart',
      question: "It's easy to judge people by how they look or act. How can you try to see others the way the Lord sees them?",
    },
    {
      ref: 'Genesis 1:31',
      excerpt: 'And God saw every thing that he had made, and, behold, it was very good',
      question: "God enjoyed His creations. What is something you made that you're proud of?",
    },
    {
      ref: '1 Peter 4:10',
      question: 'Everyone has gifts. What gift or talent do you have that could help someone else?',
    },
    {
      ref: 'D&C 46:11',
      question: 'Think of a friend. What gift do they have that you admire? Tell them!',
    },
    {
      ref: '2 Nephi 26:33',
      excerpt: 'he denieth none that come unto him, black and white, bond and free, male and female',
      question: 'God loves everyone the same. How can you make someone who is different from you feel welcome?',
    },
    {
      ref: 'Deuteronomy 31:6',
      question: "Being strong doesn't mean never being scared. What is something you can do even if you feel afraid?",
    },
    {
      ref: '2 Timothy 1:7',
      question: 'God gives a spirit of power, love, and a sound mind. When you feel worried, what helps you feel calm and clear?',
    },
    {
      ref: 'Isaiah 41:10',
      question: 'God promises to hold you up. Write about a time you felt His help.',
    },
    {
      ref: 'Alma 56:47',
      question: 'The stripling warriors were young but brave because of what their mothers taught them. What has your family taught you that makes you brave?',
    },
    {
      ref: 'D&C 6:36',
      question: 'How can you *look unto* Jesus during an ordinary school day?',
    },
    {
      ref: 'Matthew 25:40',
      question: "When we help someone who is struggling, we're helping Jesus. Who could use your help this week?",
    },
    {
      ref: 'Psalms 46:10',
      excerpt: 'Be still, and know that I am God',
      question: 'When was the last time you were really still? Try two minutes of quiet. What did you notice?',
    },
    {
      ref: 'Mark 6:31',
      excerpt: 'Come ye yourselves apart into a desert place, and rest a while',
      question: 'Even Jesus and His disciples needed rest. What is your favorite way to rest and recharge?',
    },
    {
      ref: '1 Corinthians 3:16',
      question: 'Your body is a temple. What is one healthy habit (sleep, food, exercise, screen time) you could improve?',
    },
    {
      ref: 'Proverbs 17:22',
      question: "What makes you laugh? How can you bring more joy into your day and someone else's?",
    },
    {
      ref: '2 Nephi 2:25',
      question: 'Heavenly Father wants you to have joy. What brought you joy this week?',
    },
    {
      ref: 'John 16:33',
      excerpt: 'be of good cheer; I have overcome the world',
      question: 'Jesus has overcome everything. What worry could you hand over to Him?',
    },
    {
      ref: 'Romans 12:10',
      question: '*Preferring one another* means putting others first. How can you put someone else first this week?',
    },
  ],
};
