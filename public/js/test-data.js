// Test content shown to the candidate. The answer key is NOT here — it lives
// server-side in lib/answer-key.js so it never reaches the browser.
//
// Inline markup used in text fields:
//   {{n}}      answer gap for question n (typed, or a drop slot in drag groups)
//   **text**   bold
// Line prefixes in `lines`:
//   "# "  heading     "## " sub-heading     "- "  bullet     otherwise a plain line

export const TEST = {
  id: 'cam20-ac-t2',
  title: 'IELTS Academic mock test',
  source: 'Cambridge IELTS 20, Academic Test 2',

  listening: {
    reviewSeconds: 120,
    tracks: [
      { src: 'audio/listening-part1.mp3', duration: 408.207 },
      { src: 'audio/listening-part2.mp3', duration: 428.848 },
      { src: 'audio/listening-part3.mp3', duration: 422.393 },
      { src: 'audio/listening-part4.mp3', duration: 571.418 },
    ],
    parts: [
      {
        label: 'Part 1',
        intro: 'Listen and answer questions 1–10.',
        range: [1, 10],
        groups: [
          {
            type: 'gaps',
            range: [1, 10],
            instructions: ['Complete the notes below.', 'Write **ONE WORD AND/OR A NUMBER** for each answer.'],
            title: 'Local councils can arrange practical support to help those caring for elderly people at home',
            lines: [
              'This can give the carer:',
              '- time for other responsibilities',
              '- a {{1}}',
              '## Assessment of mother’s needs',
              'This may include discussion of:',
              '- how much {{2}} the caring involves',
              'What types of tasks are involved, e.g.:',
              '- help with dressing',
              '- helping her have a {{3}}',
              '- shopping',
              '- helping with meals',
              '- dealing with {{4}}',
              'Any aspects of caring that are especially difficult, e.g.:',
              '- loss of {{5}}',
              '- {{6}} her',
              '- preventing a {{7}}',
              '## Types of support that may be offered to carers',
              '- transport costs, e.g. cost of a {{8}}',
              '- car-related costs, e.g. fuel and {{9}}',
              '- help with housework',
              '- help to reduce {{10}}',
            ],
          },
        ],
      },
      {
        label: 'Part 2',
        intro: 'Listen and answer questions 11–20.',
        range: [11, 20],
        groups: [
          {
            type: 'match',
            range: [11, 16],
            instructions: [
              'What is the role of the volunteers in each of the following activities?',
              'Choose **SIX** answers from the box and drag the correct letter, **A–I**, next to questions 11–16.',
            ],
            itemsTitle: 'Activities',
            optionsTitle: 'Role of the volunteers',
            options: [
              ['A', 'providing entertainment'],
              ['B', 'providing publicity about a council service'],
              ['C', 'contacting local businesses'],
              ['D', 'giving advice to visitors'],
              ['E', 'collecting feedback on events'],
              ['F', 'selling tickets'],
              ['G', 'introducing guest speakers at an event'],
              ['H', 'encouraging cooperation between local organisations'],
              ['I', 'helping people find their seats'],
            ],
            items: [
              [11, 'walking around the town centre'],
              [12, 'helping at concerts'],
              [13, 'getting involved with community groups'],
              [14, 'helping with a magazine'],
              [15, 'participating at lunches for retired people'],
              [16, 'helping with the website'],
            ],
          },
          {
            type: 'choice',
            range: [17, 20],
            instructions: ['Choose the correct letter, **A, B or C**.'],
            questions: [
              { n: 17, stem: 'Which event requires the largest number of volunteers?', options: [['A', 'the music festival'], ['B', 'the science festival'], ['C', 'the book festival']] },
              { n: 18, stem: 'What is the most important requirement for volunteers at the festivals?', options: [['A', 'interpersonal skills'], ['B', 'personal interest in the event'], ['C', 'flexibility']] },
              { n: 19, stem: 'New volunteers will start working in the week beginning', options: [['A', '2 September'], ['B', '9 September'], ['C', '23 September']] },
              { n: 20, stem: 'What is the next annual event for volunteers?', options: [['A', 'a boat trip'], ['B', 'a barbecue'], ['C', 'a party']] },
            ],
          },
        ],
      },
      {
        label: 'Part 3',
        intro: 'Listen and answer questions 21–30.',
        range: [21, 30],
        groups: [
          {
            type: 'match',
            range: [21, 25],
            instructions: [
              'What is Rosie and Colin’s opinion about each of the following aspects of human geography?',
              'Choose **FIVE** answers from the box and drag the correct letter, **A–G**, next to questions 21–25.',
            ],
            itemsTitle: 'Aspects of human geography',
            optionsTitle: 'Opinions',
            options: [
              ['A', 'The information given about this was too vague.'],
              ['B', 'This may not be relevant to their course.'],
              ['C', 'This will involve only a small number of statistics.'],
              ['D', 'It will be easy to find facts about this.'],
              ['E', 'The facts about this may not be reliable.'],
              ['F', 'No useful research has been done on this.'],
              ['G', 'The information provided about this was interesting.'],
            ],
            items: [
              [21, 'Population'],
              [22, 'Health'],
              [23, 'Economies'],
              [24, 'Culture'],
              [25, 'Poverty'],
            ],
          },
          {
            type: 'choice',
            range: [26, 30],
            instructions: ['Choose the correct letter, **A, B or C**.'],
            questions: [
              { n: 26, stem: 'Rosie says that in her own city the main problem is', options: [['A', 'crime.'], ['B', 'housing.'], ['C', 'unemployment.']] },
              { n: 27, stem: 'What recent additions to the outskirts of their cities are both students happy about?', options: [['A', 'conference centres'], ['B', 'sports centres'], ['C', 'retail centres']] },
              { n: 28, stem: 'The students agree that developing disused industrial sites may', options: [['A', 'have unexpected costs.'], ['B', 'damage the urban environment.'], ['C', 'destroy valuable historical buildings.']] },
              { n: 29, stem: 'The students will mention Masdar City as an example of an attempt to achieve', options: [['A', 'daily collections for waste recycling.'], ['B', 'sustainable energy use.'], ['C', 'free transport for everyone.']] },
              { n: 30, stem: 'When discussing the ecotown of Greenhill Abbots, Colin is uncertain about', options: [['A', 'what its objectives were.'], ['B', 'why there was opposition to it.'], ['C', 'how much of it has actually been built.']] },
            ],
          },
        ],
      },
      {
        label: 'Part 4',
        intro: 'Listen and answer questions 31–40.',
        range: [31, 40],
        groups: [
          {
            type: 'gaps',
            range: [31, 40],
            instructions: ['Complete the notes below.', 'Write **ONE WORD ONLY** for each answer.'],
            title: 'Developing food trends',
            lines: [
              'The growth in interest in food fashions started with {{31}} of food being shared on social media.',
              'The UK food industry is constantly developing products which are new or different.',
              'Influencers on social media become ‘ambassadors’ for a brand.',
              'Sales of {{32}} food brands have grown rapidly this way.',
              'Supermarkets track demand for ingredients on social media.',
              'Famous {{33}} are influential.',
              '# Marketing campaigns',
              '## The avocado',
              '- {{34}} were invited to visit growers in South Africa.',
              '- Advertising focused on its {{35}} benefits.',
              '## Oat milk',
              '- A Swedish brand’s media campaign received publicity by upsetting competitors.',
              '- Promotion in the USA through {{36}} shops reduced the need for advertising.',
              '- It appealed to consumers who are concerned about the {{37}}.',
              '## Norwegian skrei',
              '- has helped strengthen the {{38}} of Norwegian seafood.',
              '# Ethical concerns',
              '## Quinoa',
              '- Its success led to an increase in its {{39}}.',
              '- Overuse of resources resulted in poor quality {{40}}.',
            ],
          },
        ],
      },
    ],
  },

  reading: {
    minutes: 60,
    parts: [
      {
        label: 'Part 1',
        intro: 'Read the text and answer questions 1–13.',
        range: [1, 13],
        passage: {
          title: 'Manatees',
          paragraphs: [
            'Manatees, also known as sea cows, are aquatic mammals that belong to a group of animals called Sirenia. This group also contains dugongs. Dugongs and manatees look quite alike – they are similar in size, colour and shape, and both have flexible flippers for forelimbs. However, the manatee has a broad, rounded tail, whereas the dugong’s is fluked, like that of a whale. There are three species of manatees: the West Indian manatee (<i>Trichechus manatus</i>), the African manatee (<i>Trichechus senegalensis</i>) and the Amazonian manatee (<i>Trichechus inunguis</i>).',
            'Unlike most mammals, manatees have only six bones in their neck – most others, including humans and giraffes, have seven. This short neck allows a manatee to move its head up and down, but not side to side. To see something on its left or its right, a manatee must turn its entire body, steering with its flippers. Manatees have pectoral flippers but no back limbs, only a tail for propulsion. They do have pelvic bones, however – a leftover from their evolution from a four-legged to a fully aquatic animal. Manatees share some visual similarities to elephants. Like elephants, manatees have thick, wrinkled skin. They also have some hairs covering their bodies which help them sense vibrations in the water around them.',
            'Seagrasses and other marine plants make up most of a manatee’s diet. Manatees spend about eight hours each day grazing and uprooting plants. They eat up to 15% of their weight in food each day. African manatees are omnivorous – studies have shown that molluscs and fish make up a small part of their diets. West Indian and Amazonian manatees are both herbivores.',
            'Manatees’ teeth are all molars – flat, rounded teeth for grinding food. Due to manatees’ abrasive aquatic plant diet, these teeth get worn down and they eventually fall out, so they continually grow new teeth that get pushed forward to replace the ones they lose. Instead of having incisors to grasp their food, manatees have lips which function like a pair of hands to help tear food away from the seafloor.',
            'Manatees are fully aquatic, but as mammals, they need to come up to the surface to breathe. When awake, they typically surface every two to four minutes, but they can hold their breath for much longer. Adult manatees sleep underwater for 10–12 hours a day, but they come up for air every 15–20 minutes. Active manatees need to breathe more frequently. It’s thought that manatees use their muscular diaphragm and breathing to adjust their buoyancy. They may use diaphragm contractions to compress and store gas in folds in their large intestine to help them float.',
            'The West Indian manatee reaches about 3.5 metres long and weighs on average around 500 kilogrammes. It moves between fresh water and salt water, taking advantage of coastal mangroves and coral reefs, rivers, lakes and inland lagoons. There are two subspecies of West Indian manatee: the Antillean manatee is found in waters from the Bahamas to Brazil, whereas the Florida manatee is found in US waters, although some individuals have been recorded in the Bahamas. In winter, the Florida manatee is typically restricted to Florida. When the ambient water temperature drops below 20°C, it takes refuge in naturally and artificially warmed water, such as at the warm-water outfalls from powerplants.',
            'The African manatee is also about 3.5 metres long and found in the sea along the west coast of Africa, from Mauritania down to Angola. The species also makes use of rivers, with the mammals seen in landlocked countries such as Mali and Niger. The Amazonian manatee is the smallest species, though it is still a big animal. It grows to about 2.5 metres long and 350 kilogrammes. Amazonian manatees favour calm, shallow waters that are above 23°C. This species is found in fresh water in the Amazon Basin in Brazil, as well as in Colombia, Ecuador and Peru.',
            'All three manatee species are endangered or at a heightened risk of extinction. The African manatee and Amazonian manatee are both listed as Vulnerable by the International Union for Conservation of Nature (IUCN). It is estimated that 140,000 Amazonian manatees were killed between 1935 and 1954 for their meat, fat and skin, with the latter used to make leather. In more recent years, African manatee decline has been tied to incidental capture in fishing nets and hunting. Manatee hunting is now illegal in every country the African species is found in.',
            'The two subspecies of West Indian manatee are listed as Endangered by the IUCN. Both are also expected to undergo a decline of 20% over the next 40 years. A review of almost 1,800 cases of entanglement in fishing nets and of plastic consumption among marine mammals in US waters from 2009 to 2020 found that at least 700 cases involved manatees. The chief cause of death in Florida manatees is boat strikes. However, laws in certain parts of Florida now limit boat speeds during winter, allowing slow-moving manatees more time to respond.',
          ],
        },
        groups: [
          {
            type: 'gaps',
            range: [1, 6],
            instructions: ['Complete the notes below.', 'Choose **ONE WORD AND/OR A NUMBER** from the passage for each answer.'],
            title: 'Manatees',
            lines: [
              '## Appearance',
              '- look similar to dugongs, but with a differently shaped {{1}}',
              '## Movement',
              '- have fewer neck bones than most mammals',
              '- need to use their {{2}} to help to turn their bodies around in order to look sideways',
              '- sense vibrations in the water by means of {{3}} on their skin',
              '## Feeding',
              '- eat mainly aquatic vegetation, such as {{4}}',
              '- grasp and pull up plants with their {{5}}',
              '## Breathing',
              '- come to the surface for air every 2–4 minutes when awake and every 15–20 minutes while sleeping',
              '- may regulate the {{6}} of their bodies by using muscles of diaphragm to store air internally',
            ],
          },
          {
            type: 'judge',
            range: [7, 13],
            scale: ['TRUE', 'FALSE', 'NOT GIVEN'],
            instructions: [
              'Do the following statements agree with the information given in Reading Passage 1?',
              'Choose',
              '**TRUE** if the statement agrees with the information',
              '**FALSE** if the statement contradicts the information',
              '**NOT GIVEN** if there is no information on this',
            ],
            questions: [
              { n: 7, stem: 'West Indian manatees can be found in a variety of different aquatic habitats.' },
              { n: 8, stem: 'The Florida manatee lives in warmer waters than the Antillean manatee.' },
              { n: 9, stem: 'The African manatee’s range is limited to coastal waters between the West African countries of Mauritania and Angola.' },
              { n: 10, stem: 'The extent of the loss of Amazonian manatees in the mid-twentieth century was only revealed many years later.' },
              { n: 11, stem: 'It is predicted that West Indian manatee populations will fall in the coming decades.' },
              { n: 12, stem: 'The risk to manatees from entanglement and plastic consumption increased significantly in the period 2009–2020.' },
              { n: 13, stem: 'There is some legislation in place which aims to reduce the likelihood of boat strikes on manatees in Florida.' },
            ],
          },
        ],
      },
      {
        label: 'Part 2',
        intro: 'Read the text and answer questions 14–26.',
        range: [14, 26],
        passage: {
          title: 'Procrastination',
          subtitle: 'A psychologist explains why we put off important tasks and how we can break this habit',
          lettered: true,
          paragraphs: [
            'Procrastination is the habit of delaying a necessary task, usually by focusing on less urgent, more enjoyable, and easier activities instead. We all do it from time to time. We might be composing a message to a friend who we have to let down, or putting together an important report for college or work; we’re doing our best to avoid doing the job at hand, but deep down we know that we should just be getting on with it. Unfortunately, berating ourselves won’t stop us procrastinating again. In fact, it’s one of the worst things we can do. This matters because, as my research shows, procrastination doesn’t just waste time, but is actually linked to other problems, too.',
            'Contrary to popular belief, procrastination is not due to laziness or poor time management. Scientific studies suggest procrastination is, in fact, caused by poor mood management. This makes sense if we consider that people are more likely to put off starting or completing tasks that they are really not keen to do. If just thinking about the task threatens our sense of self-worth or makes us anxious, we will be more likely to put it off. Research involving brain imaging has found that areas of the brain linked to detection of threats and emotion regulation are actually different in people who chronically procrastinate compared to those who don’t procrastinate frequently.',
            'Tasks that are emotionally loaded or difficult, such as preparing for exams, are prime candidates for procrastination. People with low self-esteem are more likely to procrastinate. Another group of people who tend to procrastinate are perfectionists, who worry their work will be judged harshly by others. We know that if we don’t finish that report or complete those home repairs, then what we did can’t be evaluated. When we avoid such tasks, we also avoid the negative emotions associated with them. This is rewarding, and it conditions us to use procrastination to repair our mood. If we engage in more enjoyable tasks instead, we get another mood boost. In the long run, however, procrastination isn’t an effective way of managing emotions. The ‘mood repair’ we experience is temporary. Afterwards, people tend to be left with a sense of guilt that not only increases their negative mood, but also reinforces their tendency to procrastinate.',
            'So why is this such a problem? When most people think of the costs of procrastination, they think of the toll on productivity. For example, studies have shown that procrastination negatively impacts on student performance. But putting off reading textbooks and writing essays may affect other areas of students’ lives. In one study of over 3,000 German students over a six-month period, those who reported procrastinating over their university work were also more likely to engage in study-related misconduct, such as cheating and plagiarism. But the behaviour that procrastination was most closely linked with was using fraudulent excuses to get deadline extensions. Other research shows that employees on average spend almost a quarter of their workday procrastinating, and again this is linked with negative outcomes. In fact, in one US survey of over 22,000 employees, participants who said they regularly procrastinated had less annual income and less employment stability. For every one-point increase on a measure of chronic procrastination, annual income decreased by US$15,000.',
            'Procrastination also correlates with serious health and well-being problems. A tendency to procrastinate is linked to poor mental health, including higher levels of depression and anxiety. Across numerous studies, I’ve found people who regularly procrastinate report a greater number of health issues, such as headaches, flu and colds, and digestive issues. They also experience higher levels of stress and poor sleep quality. They are less likely to practise healthy behaviours, such as eating a healthy diet and regularly exercising, and use destructive coping strategies to manage their stress. In one study of over 700 people, I found people prone to procrastination had a 63% greater risk of poor heart health after accounting for other personality traits and demographics.',
            'Finding better ways of managing our emotions is one route out of the vicious cycle of procrastination. An important first step is to manage our environment and how we view the task. There are a number of evidence-based strategies that can help us fend off distractions that can occupy our minds when we should be focusing on the thing we should be getting on with. For example, reminding ourselves about why the task is important and valuable can increase positive feelings towards it. Forgiving ourselves and feeling compassion when we procrastinate can help break the procrastination cycle. We should admit that we feel bad, but not be overly critical of ourselves. We should remind ourselves that we’re not the first person to procrastinate, nor the last. Doing this can take the edge off the negative feelings we have about ourselves when we procrastinate. This can all make it easier to get back on track.',
          ],
        },
        groups: [
          {
            type: 'grid',
            range: [14, 16],
            letters: ['A', 'B', 'C', 'D', 'E', 'F'],
            instructions: [
              'Reading Passage 2 has six paragraphs, **A–F**.',
              'Which paragraph contains the following information?',
              'Choose the correct letter, **A–F**.',
              '**NB** You may use any letter more than once.',
            ],
            questions: [
              { n: 14, stem: 'mention of false assumptions about why people procrastinate' },
              { n: 15, stem: 'reference to the realisation that others also procrastinate' },
              { n: 16, stem: 'neurological evidence of a link between procrastination and emotion' },
            ],
          },
          {
            type: 'gaps',
            range: [17, 22],
            flow: true,
            instructions: ['Complete the summary below.', 'Choose **ONE WORD ONLY** from the passage for each answer.'],
            title: 'What makes us procrastinate?',
            lines: [
              'Many people think that procrastination is the result of {{17}}. Others believe it to be the result of an inability to organise time efficiently. But scientific studies suggest that procrastination is actually due to poor mood management. The tasks we are most likely to put off are those that could damage our self-esteem or cause us to feel {{18}} when we think about them. Research comparing chronic procrastinators with other people even found differences in the brain regions associated with regulating emotions and identifying {{19}}.',
              'Emotionally loaded and difficult tasks often cause us to procrastinate. Getting ready to take {{20}} might be a typical example of one such task. People who are likely to procrastinate tend to be either {{21}} or those with low self-esteem.',
              'Procrastination is only a short-term measure for managing emotions. It’s often followed by a feeling of {{22}}, which worsens our mood and leads to more procrastination.',
            ],
          },
          {
            type: 'multi',
            range: [23, 24],
            pick: 2,
            instructions: ['Choose **TWO** letters, **A–E**.'],
            stem: 'Which **TWO** comparisons between employees who often procrastinate and those who do not are mentioned in the text?',
            options: [
              ['A', 'Their salaries are lower.'],
              ['B', 'The quality of their work is inferior.'],
              ['C', 'They don’t keep their jobs for as long.'],
              ['D', 'They don’t enjoy their working lives as much.'],
              ['E', 'They have poorer relationships with colleagues.'],
            ],
          },
          {
            type: 'multi',
            range: [25, 26],
            pick: 2,
            instructions: ['Choose **TWO** letters, **A–E**.'],
            stem: 'Which **TWO** recommendations for getting out of a cycle of procrastination does the writer give?',
            options: [
              ['A', 'not judging ourselves harshly'],
              ['B', 'setting ourselves manageable aims'],
              ['C', 'rewarding ourselves for tasks achieved'],
              ['D', 'prioritising tasks according to their importance'],
              ['E', 'avoiding things that stop us concentrating on our tasks'],
            ],
          },
        ],
      },
      {
        label: 'Part 3',
        intro: 'Read the text and answer questions 27–40.',
        range: [27, 40],
        passage: {
          title: 'Invasion of the Robot Umpires',
          paragraphs: [
            'A few years ago, Fred DeJesus from Brooklyn, New York became the first umpire in a minor league baseball game to use something called the Automated Ball-Strike System (ABS), often referred to as the ‘robo-umpire’. Instead of making any judgments himself about a strike*, DeJesus had decisions fed to him through an earpiece, connected to a modified missile-tracking system. The contraption looked like a large black pizza box with one glowing green eye; it was mounted above the press stand.',
            'Major League Baseball (MLB), who had commissioned the system, wanted human umpires to announce the calls, just as they would have done in the past. When the first pitch came in, a recorded voice told DeJesus it was a strike. Previously, calling a strike was a judgment call on the part of the umpire. Even if the batter does not hit the ball, a pitch that passes through the ‘strike zone’ (an imaginary zone about seventeen inches wide, stretching from the batter’s knees to the middle of his chest) is considered a strike. During that first game, when DeJesus announced calls, there was no heckling and no shouted disagreement. Nobody said a word.',
            'For a hundred and fifty years or so, the strike zone has been the game’s animating force – countless arguments between a team’s manager and the umpire have taken place over its boundaries and whether a ball had crossed through it. The rules of play have evolved in various stages. Today, everyone knows that you may scream your disagreement in an umpire’s face, but you must never shout personal abuse at them or touch them. That’s a no-no. When the robo-umpires came, however, the arguments stopped.',
            'During the first robo-umpire season, players complained about some strange calls. In response, MLB decided to tweak the dimensions of the zone, and the following year the consensus was that ABS is profoundly consistent. MLB says the device is near-perfect, precise to within fractions of an inch. “It’ll reduce controversy in the game, and be good for the game,” says Rob Manfred, who is Commissioner for MLB. But the question is whether controversy is worth reducing, or whether it is the sign of a human hand.',
            'A human, at least, yells back. When I spoke with Frank Viola, a coach for a North Carolina team, he said that ABS works as designed, but that it was also unforgiving and pedantic, almost legalistic. “Manfred is a lawyer,” Viola noted. Some pitchers have complained that, compared with a human’s, the robot’s strike zone seems too precise. Viola was once a major-league player himself. When he was pitching, he explained, umpires rewarded skill. “Throw it where you aimed, and it would be a strike, even if it was an inch or two outside. There was a dialogue between pitcher and umpire.”',
            'The executive tasked with running the experiment for MLB is Morgan Sword, who’s in charge of baseball operations. According to Sword, ABS was part of a larger project to make baseball more exciting since executives are terrified of losing younger fans, as has been the case with horse racing and boxing. He explains how they began the process by asking fans what version of baseball they found most exciting. The results showed that everyone wanted more action: more hits, more defense, more baserunning. This type of baseball essentially hasn’t existed since the 1960s, when the hundred-mile-an-hour fastball, which is difficult to hit and control, entered the game. It flattened the game into strikeouts, walks, and home runs – a type of play lacking much action.',
            'Sword’s team brainstormed potential fixes. Any rule that existed, they talked about changing – from changing the bats to changing the geometry of the field. But while all of these were ruled out as potential fixes, ABS was seen as a perfect vehicle for change. According to Sword, once you get the technology right, you can load any strike zone you want into the system. “It might be a triangle, or a blob, or something shaped like Texas. Over time, as baseball evolves, ABS can allow the zone to change with it.”',
            '“In the past twenty years, sports have moved away from judgment calls. Soccer has Video Assistant Referees (for offside decisions, for example). Tennis has Hawk-Eye (for line calls, for example). For almost a decade, baseball has used instant replay on the base paths. This is widely liked, even if the precision can sometimes cause problems. But these applications deal with something physical: bases, lines, goals. The boundaries of action are precise, delineated like the keys of a piano. This is not the case with ABS and the strike zone. Historically, a certain discretion has been appreciated.”',
            'I decided to email Alva Noë, a professor at Berkeley University and a baseball fan, for his opinion. “Hardly a day goes by that I don’t wake up and run through the reasons that this [robo-umpires] is such a terrible idea,” he replied. He later told me, “This is part of a movement to use algorithms to take the hard choices of living out of life.” Perhaps he’s right. We watch baseball to kill time, not to maximize it. Some players I have met take a dissenting stance toward the robots too, believing that accuracy is not the answer.',
            'According to Joe Russo, who plays for a New Jersey team, “With technology, people just want everything to be perfect. That’s not reality. I think perfect would be weird. Your teams are always winning, work is always just great, there’s always money in your pocket, your car never breaks down. What is there to talk about?”',
          ],
          footnote: '*strike: a strike is when the batter swings at a ball and misses or when the batter does not swing at a ball that passes through the strike zone.',
        },
        groups: [
          {
            type: 'judge',
            range: [27, 32],
            scale: ['YES', 'NO', 'NOT GIVEN'],
            instructions: [
              'Do the following statements agree with the claims of the writer in Reading Passage 3?',
              'Choose',
              '**YES** if the statement agrees with the claims of the writer',
              '**NO** if the statement contradicts the claims of the writer',
              '**NOT GIVEN** if it is impossible to say what the writer thinks about this',
            ],
            questions: [
              { n: 27, stem: 'When DeJesus first used ABS, he shared decision-making about strikes with it.' },
              { n: 28, stem: 'MLB considered it necessary to amend the size of the strike zone when criticisms were received from players.' },
              { n: 29, stem: 'MLB is keen to justify the money spent on improving the accuracy of ABS’s calculations.' },
              { n: 30, stem: 'The hundred-mile-an-hour fastball led to a more exciting style of play.' },
              { n: 31, stem: 'The differing proposals for alterations to the baseball bat led to fierce debate on Sword’s team.' },
              { n: 32, stem: 'ABS makes changes to the shape of the strike zone feasible.' },
            ],
          },
          {
            type: 'match',
            summary: true,
            range: [33, 37],
            instructions: ['Complete the summary using the list of phrases, **A–H**, below.', 'Drag the correct phrase into each gap.'],
            title: 'Calls by the umpire',
            text: [
              'Even after ABS was developed, MLB still wanted human umpires to shout out decisions as they had in their {{33}}. The umpire’s job had, at one time, required a {{34}} about whether a ball was a strike. A ball is considered a strike when the batter does not hit it and it crosses through a {{35}} extending approximately from the batter’s knee to his chest.',
              'In the past, {{36}} over strike calls were not uncommon, but today everyone accepts the complete ban on pushing or shoving the umpire. One difference, however, is that during the first game DeJesus used ABS, strike calls were met with {{37}}.',
            ],
            optionsTitle: 'List of phrases',
            options: [
              ['A', 'pitch boundary'],
              ['B', 'numerous disputes'],
              ['C', 'team tactics'],
              ['D', 'subjective assessment'],
              ['E', 'widespread approval'],
              ['F', 'former roles'],
              ['G', 'total silence'],
              ['H', 'perceived area'],
            ],
          },
          {
            type: 'choice',
            range: [38, 40],
            instructions: ['Choose the correct letter, **A, B, C or D**.'],
            questions: [
              {
                n: 38,
                stem: 'What does the writer suggest about ABS in the fifth paragraph?',
                options: [
                  ['A', 'It is bound to make key decisions that are wrong.'],
                  ['B', 'It may reduce some of the appeal of the game.'],
                  ['C', 'It will lead to the disappearance of human umpires.'],
                  ['D', 'It may increase calls for the rules of baseball to be changed.'],
                ],
              },
              {
                n: 39,
                stem: 'Morgan Sword says that the introduction of ABS',
                options: [
                  ['A', 'was regarded as an experiment without a guaranteed outcome.'],
                  ['B', 'was intended to keep up with developments in other sports.'],
                  ['C', 'was a response to changing attitudes about the role of sport.'],
                  ['D', 'was an attempt to ensure baseball retained a young audience.'],
                ],
              },
              {
                n: 40,
                stem: 'Why does the writer include the views of Noë and Russo?',
                options: [
                  ['A', 'to show that attitudes to technology vary widely'],
                  ['B', 'to argue that people have unrealistic expectations of sport'],
                  ['C', 'to indicate that accuracy is not the same thing as enjoyment'],
                  ['D', 'to suggest that the number of baseball fans needs to increase'],
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  writing: {
    minutes: 60,
    tasks: [
      {
        label: 'Part 1',
        intro: 'You should spend about 20 minutes on this task. Write at least 150 words.',
        minWords: 150,
        prompt: [
          'The plans below show the site of a farm in 1950 and the same site today.',
          'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        ],
        figure: 'beechwood',
      },
      {
        label: 'Part 2',
        intro: 'You should spend about 40 minutes on this task. Write at least 250 words.',
        minWords: 250,
        prompt: ['Write about the following topic:'],
        topic: [
          'In many countries, primary and secondary schools close for two months or more in the summer holidays.',
          'What is the value of long school holidays?',
          'What are the arguments in favour of shorter school holidays?',
        ],
        after: ['Give reasons for your answer and include any relevant examples from your own knowledge or experience.'],
      },
    ],
  },
};

// Every question number in a section, in order — used by the navigator.
export function questionNumbers(part) {
  const out = [];
  for (let n = part.range[0]; n <= part.range[1]; n++) out.push(n);
  return out;
}
