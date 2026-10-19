type CatalogueSection = {
  description: string;
  id: string;
  items: Array<{ answer: string; question: string }>;
  title: string;
};

/** Full Mundoria FAQ catalogue. */
export const SITE_FAQ_CATALOGUE: CatalogueSection[] = [
  {
    id: "about-mundoria",
    title: "About Mundoria",
    description: "What Mundoria is, how it works, and who it’s for.",
    items: [
      {
        question: "What is Mundoria?",
        answer:
          "Mundoria is a simpler way to arrange and manage cleaning around your life.\n\nYou tell us what you need, when you need it and the details that matter to you. Mundoria brings the rest of the journey together, from arranging the booking and matching it with a suitable cleaning professional to keeping your preferences, updates and payment connected in one place.\n\nYou can use Mundoria for the everyday things, like keeping your home looked after every week or fortnight, but also for the moments when life changes. You might be moving into a new home, preparing to leave one, arranging cleaning for a workplace, getting ready for a new baby or helping prepare a home for someone returning from hospital.\n\nThe idea behind Mundoria is not complicated.\nCleaning needs to happen. Arranging it should not become another job.\n\nWe want the experience to feel easy enough that you can sort what you need, know what is happening and get back to everything else.",
      },
      {
        question: "Is Mundoria a cleaning company?",
        answer:
          "Not in the traditional sense.\n\nMundoria is a platform that helps customers arrange and manage cleaning through independent cleaning professionals.\n\nBut we also do not want to be a directory that simply gives you someone's phone number and leaves you to figure out everything else.\n\nMundoria sits around the experience.\nWe help bring together the booking, the details of the job, your preferences, matching, communication, payment and support if something changes.\n\nThe cleaning itself is carried out by independent cleaning professionals who have gone through Mundoria's onboarding process, including the checks, insurance requirements and in-house training required for the types of bookings they take through the platform.\n\nSo while a traditional cleaning company may organise things for you manually, and a directory may simply introduce you to someone, Mundoria is designed to make the whole journey easier to arrange and manage in one place.",
      },
      {
        question: "How does Mundoria work?",
        answer:
          "It starts with you telling us what you need.\n\nChoose the type of cleaning, tell us about your space, select an available time and add the details that matter to you. That might include particular areas you want prioritised, access information, pets, product preferences or something specific about your circumstances.\n\nMundoria then uses the information attached to the booking to help arrange a suitable cleaning professional. Availability matters, but it is not the only thing that can matter. The location, type of cleaning, expected duration, relevant experience, travel practicality and requirements of the booking can all help determine whether a job is a sensible fit.\n\nOnce the booking is arranged, the important information stays connected to the experience so you are not piecing everything together yourself.\n\nAnd if something changes, there is a process behind that too. For example, if the professional becomes unavailable, Mundoria can use the existing booking information to look for a suitable replacement where one is available.\n\nFrom your side, we want it to feel straightforward:\nTell us what you need. We arrange the details around it. You stay informed and get on with your day.",
      },
      {
        question: "Why was Mundoria created?",
        answer:
          "Because we felt cleaning should be much easier to arrange than it often is.\n\nBefore building Mundoria, we spent time looking at what customers were already saying publicly about their experiences with cleaning services. We read reviews, looked through Trustpilot and paid attention to conversations happening online.\n\nThere were plenty of positive experiences, but there were also frustrations that appeared again and again.\n\nPeople talked about chasing for updates, not always understanding what they were paying for, professionals cancelling at short notice, no-shows and being left to find another solution themselves when something changed.\n\nWhat interested us was that the complaint was not always about the actual cleaning.\nSometimes the cleaning was fine.\nIt was everything around it that felt difficult.\n\nThat made us ask a simple question: if someone is arranging cleaning to make their life easier, why should arranging the cleaning become another job?\n\nMundoria grew from that question.\n\nWe wanted to create an experience where booking feels straightforward, pricing is easier to understand, people's different circumstances can be taken into account, professionals are properly onboarded, and there is a system behind the booking rather than the customer having to manage everything themselves.\n\nWe are not trying to reinvent cleaning.\nWe are trying to make dealing with it take less of your time.",
      },
      {
        question: "Where is Mundoria available?",
        answer:
          "Mundoria is currently available in Birmingham, with our coverage developing across the wider West Midlands as we grow.\n\nWe are deliberately growing the service area step by step rather than claiming to cover everywhere before we can properly support it.\n\nWhen you enter your location during the booking journey, you will be able to see whether your area is currently covered and what availability looks like.\n\nBirmingham is where we are starting.\nIt is not where we plan to stop.",
      },
      {
        question: "What types of cleaning can I book?",
        answer:
          "Mundoria services are built around four parts of life: Home, Moving, Work and Recovery.\n\nFor your home, you can arrange Regular Home Cleaning, Deep Cleaning, One-Off Cleaning and cleaning for flats and apartments. Regular cleaning can also be arranged weekly or fortnightly depending on the routine that works for your home.\n\nIf you are moving, Mundoria offers Move-In Cleaning, Move-Out Cleaning and End of Tenancy Cleaning. The idea is to take care of the cleaning side of the move while you deal with the boxes, keys and everything else.\n\nFor workplaces, Mundoria offers Office Cleaning, Retail & Hospitality Cleaning, Educational Facility Cleaning, Communal Area Cleaning and Short-Let & Holiday Rental Cleaning.\n\nMundoria Recovery is designed for moments when ordinary household cleaning may become harder to manage. That includes Pregnancy & Postpartum Home Cleaning, Illness & Injury Recovery Home Cleaning, Hospital Discharge Home Cleaning and Bereavement Home Cleaning.\n\nRecovery cleaning is still cleaning. Mundoria does not provide medical care, nursing, personal care or counselling.\n\nDifferent circumstances need different things, which is why we do not try to squeeze every booking into one generic cleaning package.",
      },
      {
        question:
          "What makes Mundoria different from a traditional cleaning company?",
        answer:
          "For us, the difference is less about claiming that we have invented a new kind of cleaning and more about how the experience around the cleaning works.\n\nWe want it to be easy to arrange in the first place. You should be able to tell us what you need, understand the basis of your price, add the details that matter to you and manage the important parts without spending your day making calls and chasing messages.\n\nWe also recognise that people do not all live the same way.\nA family that wants weekly cleaning has different needs from somebody moving out of a flat. Someone preparing for a new baby may need a different experience from an office manager arranging workplace cleaning. Someone returning from hospital may have different priorities again.\n\nMundoria is designed to make room for those differences.\n\nThere is also work happening behind the booking. Cleaning professionals go through Mundoria's onboarding process, including DBS checks, relevant due diligence, insurance requirements, experience review and in-house training for the services they intend to carry out.\n\nMatching can consider more than who happens to be free, and if a professional becomes unavailable, the aim is for the booking to enter a replacement process where possible rather than simply leaving you to start again.\n\nPricing is another part of it. We want customers to understand what they are paying for, with cleaning time and any selected products or equipment made clear during the booking.\n\nNone of those things individually need to feel revolutionary.\nPut together, they should make cleaning feel much easier to live with.",
      },
      {
        question: "Can I use Mundoria for both my home and workplace?",
        answer:
          "Yes.\n\nYou might use Mundoria to keep your home looked after and also arrange cleaning for an office, communal area or another workplace you are responsible for.\n\nThe two bookings would not simply be treated as though they were the same job.\n\nA home and an office work differently. They have different layouts, different patterns of use, different access arrangements and often different priorities.\n\nThat is why Mundoria has separate Home and Work services. You can use the same platform, while the actual booking is shaped around the type of space you are asking us to help with.",
      },
      {
        question: "Can I use Mundoria for one-off and recurring cleaning?",
        answer:
          "Yes.\n\nYou do not need to commit to regular cleaning just because you use Mundoria.\n\nIf you need help once, you can book a One-Off Cleaning service. That might be after a particularly busy few weeks, before guests arrive, after returning from holiday or simply because you would rather not do the cleaning yourself this time.\n\nIf you prefer an ongoing routine, Regular Home Cleaning can be arranged weekly, fortnightly or around another suitable recurring schedule where available.\n\nAnd you do not have to know on day one which option you will want forever.\nYou might start with one clean and later decide you would like it regularly. You may begin fortnightly and eventually realise weekly works better for your household. Life changes, so the arrangement should be able to change too.",
      },
      {
        question: "Can I book Mundoria for someone else?",
        answer:
          "Yes.\n\nYou may be booking for a parent, partner, family member, tenant, employee or somebody else whose home or space you are helping to look after.\n\nThis can be particularly useful when arranging cleaning for someone preparing for a new baby, somebody recovering from an illness or injury, or a person returning home after a hospital stay.\n\nWhat matters is that the person whose space is being cleaned knows about the arrangement where appropriate, and that you provide accurate information about the property, access and anything the cleaning professional needs to know.\n\nIf there are preferences, mobility considerations, pets, areas that should not be entered or anything else that could affect the booking, tell us when arranging it.\n\nThe aim is for the person receiving the service to feel that the booking was made for them, even if somebody else was the one who arranged it.",
      },
    ],
  },
  {
    id: "booking",
    title: "Booking",
    description: "How to book, access, timing, and special instructions.",
    items: [
      {
        question: "How do I book a clean?",
        answer:
          "Booking with Mundoria is designed to be straightforward.\n\nYou start by choosing the type of cleaning you need, then tell us a little about the space, where it is, when you would like the clean to happen and any details that matter to you.\n\nThat might include the number of rooms, areas you want prioritised, access information, pets, product preferences or anything else that helps us understand the booking properly.\n\nOnce we have the information we need, Mundoria can use it to help arrange a suitable cleaning professional for the job.\n\nThe idea is that you should not have to spend your day calling different people, repeating the same information and trying to put the whole thing together yourself.\n\nYou tell us what you need.\nWe help organise the rest around it.",
      },
      {
        question: "How far in advance should I book?",
        answer:
          "The earlier you book, the more choice you are likely to have.\n\nThat is especially true for larger cleans, moving-related bookings, weekends and times when demand is higher.\n\nIf you already know that you need cleaning on a particular date, it is worth arranging it as soon as you can.\n\nThat said, we know life does not always give you weeks of notice.\nSometimes guests are arriving unexpectedly, a move date changes or you suddenly realise you need help sooner than planned.\n\nIf professionals are available in your area, shorter-notice bookings may also be possible.",
      },
      {
        question: "Can I book a clean for the same day?",
        answer:
          "Possibly.\n\nSame-day cleaning depends on where you are, the type of service you need, how much time the booking requires and whether a suitable professional is available.\n\nWe do not want to promise same-day cleaning if the availability is not there.\n\nIf a same-day option is available for your booking, you should be able to see that during the booking journey.",
      },
      {
        question: "Can I book for someone else?",
        answer:
          "Yes.\n\nNot every booking has to be for your own home or workplace.\n\nYou might be arranging cleaning for a parent, partner, family member, tenant, employee or someone else you are helping.\n\nThe important thing is that you give us accurate information about the property, the person receiving the service where relevant, access arrangements and anything the cleaning professional needs to know.\n\nIf the person has particular preferences, mobility considerations, pets or areas they do not want entered, include those details when booking.",
      },
      {
        question: "Can I book cleaning for a family member?",
        answer:
          "Yes.\n\nYou may want to arrange cleaning for an older relative, a new parent, someone recovering from illness or simply a family member who could use a little help around the home.\n\nYou can make the booking on their behalf, provided they are aware of the arrangement where appropriate and you have the information needed to organise access and the clean properly.\n\nWe want the experience to feel as though it has been arranged around the person receiving the service, not simply around the person making the booking.",
      },
      {
        question: "Can I book cleaning for a tenant or employee?",
        answer:
          "Yes.\n\nLandlords, property managers, employers and other authorised people can arrange cleaning for spaces they are responsible for.\n\nFor a tenant's home, the person living there should be properly informed where required and access must be agreed.\n\nFor workplaces, we will need the practical information that affects the booking, such as opening hours, access, areas that need cleaning and anything that should be avoided.\n\nThe more accurately the booking reflects the actual space, the easier it is to arrange the right kind of clean.",
      },
      {
        question:
          "Can I book cleaning for someone returning home from hospital?",
        answer:
          "Yes.\n\nThis is one of the reasons we created Hospital Discharge Home Cleaning.\n\nA family member, partner or another authorised person can arrange the clean before the person returns home, provided the property can be accessed safely and the necessary booking information is provided.\n\nThe focus is on the home.\nYou may want bedrooms, bathrooms, kitchens, living areas or other agreed spaces cleaned before the person returns.\n\nMundoria does not provide medical care, nursing or personal care. We simply take care of the cleaning so there is one less practical thing to manage.",
      },
      {
        question: "Do I need to be at home during the clean?",
        answer:
          "No.\n\nSome customers prefer to be there. Others would rather provide access and come back when the cleaning is finished.\n\nEither can work.\n\nIf you will not be at the property, make sure the access arrangement is clear and the professional knows how the property should be left when the clean is complete.\n\nThe important thing is that access is safe, agreed and practical.",
      },
      {
        question: "Can I work from home while the cleaner is there?",
        answer:
          "Of course.\n\nPlenty of people will be at home while their cleaning is taking place.\n\nIf you are working, studying or taking calls, let us know if there is a particular room you will be using or a time when you would prefer noisy tasks such as vacuuming to be avoided.\n\nWhere possible, the professional can work around that.\n\nYou should not have to leave your own home just because you booked cleaning.",
      },
      {
        question: "How do I provide access if I am not home?",
        answer:
          "There are several ways this may be arranged depending on the property.\n\nYou might use a key safe, building reception, concierge, estate agent, landlord, family member or another agreed person who can provide access.\n\nWhatever arrangement you choose, make sure it is clearly explained before the booking.\n\nIf there are building entry codes, parking instructions or anything else that affects access, include that information too.\n\nThe professional should not have to arrive and then begin trying to work out how to get inside.",
      },
      {
        question: "Can I leave access instructions?",
        answer:
          "Yes.\n\nIn fact, if there is anything that is not obvious about entering or leaving the property, we would rather know in advance.\n\nThat might include which entrance to use, whether there is a concierge, where the key safe is located, how to secure the property when leaving or anything else relevant to access.\n\nKeep the instructions clear and only share sensitive access information through the appropriate Mundoria booking process.",
      },
      {
        question: "Can I use a key safe?",
        answer:
          "Yes, if that is how you normally provide secure access to the property.\n\nYou can add the relevant instructions to the booking.\n\nMake sure the code is accurate and that the key safe is accessible at the agreed time.\n\nIf the code changes before the booking, update the information as soon as possible.",
      },
      {
        question: "Can the cleaner collect keys from someone else?",
        answer:
          "This may be possible where it is practical and agreed before the booking.\n\nFor example, keys may be available from a reception desk, concierge, estate agent, landlord or another authorised person nearby.\n\nIf key collection requires significant additional travel or time, that needs to be known before the booking rather than discovered on the day.\n\nWe want access arrangements to make the clean easier, not unexpectedly take a large part of the cleaning time.",
      },
      {
        question: "Can I choose the date and time of my clean?",
        answer:
          "Yes.\n\nDuring booking, you can choose from the dates and times currently available for your service and location.\n\nDifferent professionals have different schedules, so availability can vary.\n\nFor recurring cleaning, you may also be able to establish a regular day and time that works for your household, subject to availability.\n\nThe aim is for cleaning to fit around your life, rather than asking you to reorganise your entire day around it.",
      },
      {
        question: "Can I change the time of my booking later?",
        answer:
          "Yes, where another suitable time is available.\n\nIf your plans change, you should be able to request a different date or time through the Mundoria booking process.\n\nChanges made very close to the appointment may be subject to the cancellation or rescheduling terms that apply to the booking.\n\nWe will make those rules clear rather than expecting customers to discover them after they try to make a change.",
      },
      {
        question: "Can I add special instructions to my booking?",
        answer:
          "Yes.\n\nSpecial instructions are there for the things a standard booking form cannot fully explain.\n\nYou might want to mention a pet, a delicate surface, a room that should not be entered, a particular area you want prioritised, access information or a preference about how something should be handled.\n\nIf it matters to the cleaning, tell us.\n\nThe professional should have the useful information before arriving rather than relying on you to explain everything at the door.",
      },
      {
        question: "Can I tell Mundoria which areas matter most?",
        answer:
          "Absolutely.\n\nSometimes a customer does not need every part of the property treated equally.\n\nYour kitchen and bathrooms may matter most this week.\nAnother time it may be bedrooms, floors or a living area before guests arrive.\n\nIf the booking is based on a set amount of cleaning time, telling us your priorities is particularly helpful.\n\nIt allows the professional to focus the available time on the things that matter most to you.",
      },
      {
        question: "Can I exclude certain rooms from the clean?",
        answer:
          "Yes.\n\nIf there is a bedroom, office, storage area or any other part of the property you do not want entered or cleaned, simply tell us.\n\nYour booking does not have to include every room just because it exists.\n\nWe want the clean to reflect your home and your preferences.",
      },
      {
        question: "Can I book more than one service at the same time?",
        answer:
          "Depending on the services and the booking options available, it may be possible to arrange more than one type of cleaning around the same period.\n\nFor example, you may need a move-out clean at one property and a move-in clean at another, or you may want different areas of a larger property treated differently.\n\nBecause different services can require different amounts of time, equipment or experience, some combinations may need to be arranged as separate bookings.\n\nThe important thing is that each part of the job is properly understood rather than squeezed into one booking simply for convenience.",
      },
      {
        question: "Can I extend the cleaning time after booking?",
        answer:
          "If you realise that the property may need more time than originally booked, update the booking as early as possible.\n\nAdditional time will depend on professional availability because the cleaner may have another booking afterwards.\n\nIf extra time can be added, any additional cost should be made clear before the booking is changed.\n\nIf the professional arrives and there is significantly more work than expected, they can focus on the priorities within the booked time rather than rushing through everything.\n\nThat is why accurate information at the beginning helps.\nWe would rather estimate the job properly than create unrealistic expectations about what can be completed in a limited amount of time.",
      },
    ],
  },
  {
    id: "preparing",
    title: "Preparing for a Clean",
    description: "How to get ready before your cleaner arrives.",
    items: [
      {
        question: "Do I need to clean before the cleaner arrives?",
        answer:
          "No.\n\nYou are booking a cleaner because you want the cleaning done. We do not expect you to clean before someone comes to clean.\n\nWhat does help is making sure the areas you want cleaned are reasonably accessible. If a bathroom floor is covered in laundry or a kitchen worktop is completely full of belongings, the professional may have to spend some of the booked time moving around those things instead of cleaning.\n\nSo no, you do not need to clean first.\nJust give the cleaner enough access to actually get on with the job.",
      },
      {
        question: "Do I need to tidy before the cleaner arrives?",
        answer:
          "You do not need to make your home look perfect.\n\nA little tidying can help, but only because it gives the cleaner more time to focus on cleaning rather than moving belongings from one place to another.\n\nIf toys, clothes, paperwork or other items are covering the areas you want cleaned, putting those away beforehand can make the booking more effective.\n\nThink of it this way: the clearer the surfaces and floors are, the more of the booked time can go into the actual cleaning.",
      },
      {
        question: "What should I put away before the clean?",
        answer:
          "Anything especially valuable, fragile, private or important should be put somewhere safe before the booking starts.\n\nThat includes things like jewellery, cash, important paperwork, medication, sentimental items and anything you would be uncomfortable leaving out.\n\nYou do not need to empty your home.\nJust use the same common sense you would use before letting any service professional into your space.\n\nIf something is particularly delicate, it is also worth mentioning it in the booking instructions so the cleaner knows to avoid or handle the area carefully.",
      },
      {
        question: "Do I need to move furniture before the cleaner arrives?",
        answer:
          "Usually, no.\n\nFor a regular clean, we would not expect you to start rearranging the whole room before the cleaner arrives.\n\nIf there is light furniture that can safely be moved to access an area, the professional may be able to work around it.\n\nHeavy furniture is different.\nCleaners should not be expected to move large sofas, wardrobes, beds or other heavy items as part of a normal clean unless that has been specifically agreed beforehand.\n\nIf you want an area behind or underneath something large cleaned, tell us before the booking so we can be clear about what is realistic.",
      },
      {
        question: "Should I secure valuables before the clean?",
        answer:
          "Yes, we recommend it.\n\nMundoria carries out vetting and due diligence on cleaning professionals, but it is still sensible to secure cash, jewellery, important documents, expensive personal items and anything particularly sentimental before the clean.\n\nThis is not about creating fear.\nIt is simply good practice whenever someone is working in your home.\n\nIt also removes unnecessary uncertainty for both you and the cleaner.",
      },
      {
        question: "What should I do with important documents or medication?",
        answer:
          "Keep them somewhere secure and out of the cleaning area.\n\nMedication, passports, bank documents, legal papers, work files and other sensitive items should not be left where they could accidentally be moved, wiped, knocked over or mixed in with other belongings.\n\nIf something should not be touched, put it away or clearly mark the area in your booking instructions.\n\nThe cleaner should never be expected to decide what is important and what is not.",
      },
      {
        question: "Can the cleaner work around clutter?",
        answer:
          "Yes, to a point.\n\nA home does not need to be perfectly tidy before a clean.\nBut heavy clutter can limit what the professional can realistically do in the time booked.\n\nIf surfaces and floors are completely covered, the cleaner may need to work around those items rather than fully clean underneath them.\n\nThat is why it helps to decide what matters most before the booking.\nIf you want the kitchen, bathroom and floors prioritised, make those areas as accessible as possible.\n\nThe aim is not to judge the state of the home.\nIt is simply to make the best use of the time available.",
      },
      {
        question: "Will the cleaner tidy and organise my belongings?",
        answer:
          "Mundoria cleaning is primarily about cleaning, not full home organisation.\n\nA cleaner may move small items temporarily in order to clean a surface, but large-scale tidying, sorting clothes, reorganising cupboards, arranging paperwork or deciding where personal belongings should live are different kinds of work.\n\nIf you need something more specific, tell us before the booking.\nThat way, we can be clear about what is included rather than creating different expectations on the day.",
      },
      {
        question: "Can I leave washing or dishes for the cleaner?",
        answer:
          "That depends on the service and what has been agreed.\n\nIf you want dishes, washing or another household task included, it is best to mention it when booking rather than assume it is automatically part of the clean.\n\nThe cleaner's time is limited, so anything added to the booking may reduce the time available for other areas.\n\nIf something matters to you, tell us in advance and we can make sure the priorities are clear.",
      },
      {
        question: "What if I have pets?",
        answer:
          "That is absolutely fine.\n\nJust let us know about them before the booking.\nIt helps the professional understand what to expect and avoid any surprises when they arrive.\n\nIf your pet is nervous around unfamiliar people, likely to run out through an open door or could become aggressive, please make sure they are safely managed during the clean.\n\nIf there are any pet-related areas that need particular attention, such as feeding spaces, litter areas or muddy entrances, you can add that to your booking notes too.",
      },
      {
        question: "Do I need to keep pets away during the clean?",
        answer:
          "Not always.\n\nIf your pet is calm and comfortable around unfamiliar people, they may be able to remain in the home while the cleaner works.\n\nIf the pet becomes anxious, territorial or likely to interfere with the cleaning, it is better to keep them in another secure area for the duration of the booking.\n\nThe cleaner needs to be able to move safely through the property without worrying about an animal escaping or becoming distressed.\n\nA quick note before the booking makes things much easier for everyone.",
      },
      {
        question: "Can I tell the cleaner not to enter certain rooms?",
        answer:
          "Yes.\n\nYour home is your space.\nIf there are rooms, cupboards or areas you do not want the cleaner to enter, simply make that clear in the booking instructions.\n\nYou do not need to explain why.\nIt is enough to say that the area is not part of the clean.\n\nThat helps the professional focus on the parts of the property you actually want done and avoids unnecessary confusion.",
      },
      {
        question: "Can I leave instructions if I will not be home?",
        answer:
          "Yes.\n\nIf you will not be at the property, clear instructions are especially helpful.\nYou can include things like which rooms to focus on, how to access the property, where products or equipment are kept, any areas to avoid and how the home should be secured when the cleaner leaves.\n\nTry to keep the instructions practical and easy to follow.\nThe goal is for the cleaner to understand what matters without needing to call you repeatedly while you are away.",
      },
      {
        question: "What happens if the cleaner cannot access my property?",
        answer:
          "If the professional arrives and cannot get into the property, the booking may be affected.\n\nThat is why access details need to be accurate before the clean starts.\n\nIf a key safe code changes, reception is closed, the wrong key is left out or no one is available to let the cleaner in, they may not be able to complete the booking.\n\nWhere possible, contact Mundoria as soon as you realise there may be an access problem.\nThe earlier we know, the better chance there is of sorting it out before the cleaner arrives.\n\nIf access cannot be resolved, the booking may be treated according to the cancellation or failed-access terms that apply at the time.",
      },
    ],
  },
  {
    id: "regular-home",
    title: "Regular Home Cleaning",
    description: "Weekly, fortnightly and recurring home cleans.",
    items: [
      {
        question: "What is regular home cleaning?",
        answer:
          "Regular home cleaning is for people who want their home looked after on an ongoing basis rather than waiting until everything builds up and starts to feel like a bigger job.\n\nIt is usually booked weekly or fortnightly, depending on how the home is used and what works best for the household.\n\nThe aim is not to make the home look \"show-home perfect\" every time. It is to keep the everyday areas under control so cleaning does not constantly become something you have to catch up on.\n\nFor some people, that means keeping the kitchen, bathroom and floors consistently looked after.\nFor others, it simply means knowing that every week or two, the home is getting the attention it needs without them having to spend their weekend doing it.\n\nThat is what regular cleaning is really about: keeping the home in a comfortable rhythm.",
      },
      {
        question: "What is included in regular home cleaning?",
        answer:
          "Regular home cleaning focuses on the everyday areas that usually need ongoing attention.\n\nThat can include kitchens, bathrooms, bedrooms, living areas, floors, accessible surfaces, dusting and other agreed routine cleaning tasks.\n\nThe exact priorities can depend on your home and how you want the booked time used.\n\nSome households want the kitchen and bathrooms to receive the most attention.\nOthers may care more about floors, dusting or bedrooms.\n\nThat is why we do not want regular cleaning to feel like one fixed checklist that is exactly the same for everybody.\n\nThe cleaner works within the time booked and the priorities you have given us.",
      },
      {
        question: "How often can I book regular cleaning?",
        answer:
          "The most common options are weekly and fortnightly cleaning.\n\nThose schedules tend to work well because they keep the home maintained before things have too much time to build up.\n\nThe right frequency depends on the household.\nA busy family home with children or pets may benefit from weekly cleaning, while a smaller home that stays fairly tidy may be perfectly comfortable with a fortnightly routine.\n\nThe goal is not to clean as often as possible.\nIt is to find the schedule that makes the home feel easy to keep on top of.",
      },
      {
        question: "Should I choose weekly or fortnightly cleaning?",
        answer:
          "It depends on how your home behaves between cleans.\n\nWeekly cleaning can work well for families, homes with pets, shared households, people who work from home or properties that are simply used heavily throughout the week.\n\nFortnightly cleaning can be enough for smaller households, people who are out most of the day or homes where light tidying and cleaning happens naturally between visits.\n\nIf you are unsure, fortnightly is often a sensible place to start.\nThen pay attention to how the home feels before the next clean.\nIf things are already beginning to feel uncomfortable after a week, you may prefer weekly cleaning.\nIf the home still feels fine after two weeks, you have probably found the right rhythm.",
      },
      {
        question: "How do I know how many hours of regular cleaning I need?",
        answer:
          "The number of hours depends on the size of the home, how many rooms you want cleaned, the condition of the property and what you want prioritised.\n\nA one-bedroom flat that is regularly maintained may need much less time than a busy four-bedroom family home.\n\nThat is why Mundoria asks for information about the property before the booking is confirmed.\nThe aim is to estimate the time realistically rather than pretend every home can be cleaned properly in the same amount of time.\n\nIf there is more work than can comfortably fit into the booked time, it is better to prioritise the areas that matter most rather than rush through the whole property.",
      },
      {
        question: "Can I book regular cleaning every week?",
        answer:
          "Yes.\n\nWeekly cleaning is a good option if your home is busy, you have children or pets, you work from home or you simply prefer the home to be maintained more frequently.\n\nA weekly routine also means dirt and build-up have less time to settle between visits, which can make each clean more manageable over time.",
      },
      {
        question: "Can I book regular cleaning every two weeks?",
        answer:
          "Yes.\n\nFortnightly cleaning is one of the most common routines and works well for many households.\nIt gives you regular help without having someone come every week.\n\nFor smaller homes, quieter households or people who naturally keep on top of light cleaning between visits, every two weeks can be more than enough.",
      },
      {
        question: "Can I book regular cleaning monthly?",
        answer:
          "Monthly cleaning may be possible depending on availability and how the service is configured, but for many homes it sits closer to occasional cleaning than regular maintenance.\n\nIf a full month passes between visits, there may be more build-up and the clean may need more time than a weekly or fortnightly booking.\n\nIf you are looking for something less frequent than fortnightly, it may be better to think about what you actually need each month and whether a one-off clean would suit you better.",
      },
      {
        question: "Can I change how often my regular cleaning takes place?",
        answer:
          "Yes, where availability allows.\n\nYour cleaning schedule does not need to stay exactly the same forever.\nYou may start fortnightly and later decide that weekly works better.\nYou may begin weekly and realise you do not need the cleaner quite as often.\n\nLife changes, work schedules change and households change.\nYour cleaning routine should be able to change with them.",
      },
      {
        question: "Can I pause regular cleaning while I am away?",
        answer:
          "Yes, where the booking arrangement allows it.\n\nIf you are going on holiday or will be away from home for a period of time, you should be able to pause or adjust upcoming visits rather than continue with a schedule you do not need.\n\nThe important thing is to make the change early enough so the booking can be managed properly.",
      },
      {
        question: "Can I skip one regular cleaning appointment?",
        answer:
          "Yes, subject to the notice period and booking terms that apply at the time.\n\nSometimes you may be away, have visitors staying, be renovating or simply not need that particular visit.\n\nSkipping one clean should not mean losing the whole recurring arrangement.\nYou should be able to continue with the following booking once the schedule resumes.",
      },
      {
        question: "Will I get the same cleaning professional each time?",
        answer:
          "Where possible, continuity is useful.\n\nHaving the same professional can make regular cleaning feel much easier because they become familiar with the home, the routine and the preferences that matter to you.\n\nHowever, we do not want to promise that the same person will always be available.\nIllness, holidays, schedule changes or other circumstances may occasionally mean another suitable professional is needed.\n\nThe aim is consistency where practical, without leaving you with no clean simply because one individual is unavailable.",
      },
      {
        question: "Can I request the same cleaner again?",
        answer:
          "Yes, where that professional is available and the booking is still a suitable fit for them.\n\nIf you have had a good experience and would prefer the same person again, that continuity can make regular cleaning feel more natural.\n\nThe platform still needs to consider availability and practical scheduling, but where it works, there is value in keeping a good match going.",
      },
      {
        question: "Can I request a different cleaner?",
        answer:
          "Yes.\n\nSometimes a cleaner may be capable and professional, but the fit simply does not feel right for you.\nYou should be able to ask for a different professional for future bookings.\n\nYou do not need to feel guilty about that.\nYour home is a personal space, and comfort matters.\n\nIf there was a specific problem with the booking or the cleaning, let Mundoria know so it can be reviewed properly rather than just changing the professional without understanding what happened.",
      },
      {
        question: "Can I change my regular cleaning day?",
        answer:
          "Yes, where another suitable day and time is available.\n\nIf your work schedule changes, school routines change or another day simply becomes easier, you should be able to request an adjustment.\n\nAvailability can vary, so it is better to make the change as early as possible rather than wait until the day before the clean.",
      },
      {
        question: "Can I change the number of hours later?",
        answer:
          "Yes.\n\nIf you notice that the cleaner consistently needs more time than originally booked, or that the booking can comfortably be completed in less time, the number of hours can be reviewed.\n\nIt is better for the booking to reflect what the home actually needs than to keep forcing the same amount of time simply because that was the first estimate.\n\nAny change in hours should also be reflected clearly in the price before the updated booking is confirmed.",
      },
      {
        question: "Can I change what gets cleaned from one visit to another?",
        answer:
          "Yes.\n\nRegular cleaning does not mean every visit has to be completely identical.\nSome weeks the kitchen may need more attention.\nAnother week, the bathroom may be the priority.\nYou may have guests coming and want the living areas focused on.\n\nAs long as the request fits within the service and the time booked, the priorities can change.\nThat flexibility is part of making the cleaning work around the way the home is actually being used.",
      },
      {
        question: "Can I prioritise certain rooms during a regular clean?",
        answer:
          "Yes.\n\nIn fact, if the booked time is limited, telling the cleaner what matters most can make a big difference.\nYou might want the kitchen and bathrooms completed first, then the living room and bedrooms if there is time.\nAnother household may prioritise floors and shared areas.\n\nThere is no need for every room to receive exactly the same amount of attention.\nThe cleaner should understand what matters most to you and use the available time accordingly.",
      },
      {
        question: "Is regular cleaning suitable for homes with children?",
        answer:
          "Yes.\n\nHomes with children are often some of the places where regular cleaning makes the most sense because the space is being used constantly.\nFloors, kitchens, bathrooms and shared areas can need attention more often, and regular cleaning can help stop everything building up at once.\n\nIf there are toys, sleeping routines, school schedules or rooms that need to be avoided at certain times, include that information in the booking so the cleaner can work around the household as practically as possible.",
      },
      {
        question: "Is regular cleaning suitable for homes with pets?",
        answer:
          "Yes.\n\nJust let us know that pets are in the home.\nThis helps the professional understand what to expect and plan around things like pet hair, feeding areas or an animal that may need to be kept away from open doors.\n\nIf your pet is nervous around unfamiliar people or may become aggressive, make sure they are safely managed while the cleaner is there.\n\nThe presence of pets does not make a home unsuitable for regular cleaning.\nIt is simply useful information for the booking.",
      },
      {
        question: "Can I have regular cleaning while working from home?",
        answer:
          "Yes.\n\nYou do not need to leave your home for the cleaner to work.\nIf you are working from home, tell us which room you will be using and whether there are calls, meetings or times when noisy tasks such as vacuuming would be inconvenient.\n\nWhere practical, the cleaner can arrange the order of the work around that.\nThe whole point is for the clean to fit into your life, not force your day to stop.",
      },
      {
        question: "What happens if my usual cleaner is unavailable?",
        answer:
          "If your regular professional becomes unavailable, Mundoria can use the information already attached to the booking to look for another suitable professional where possible.\n\nThat means you should not have to start from the beginning and explain the whole booking again.\nThe service, location, expected duration, timing and relevant preferences are already known.\n\nWe cannot honestly promise that a replacement will always be available, because timing, location and availability can sometimes make that impossible.\nBut the booking should not simply end with, \"Your cleaner is unavailable.\"\n\nThe aim is for a cancellation or absence to start a recovery process, with Mundoria trying to reduce the disruption and find a suitable alternative where possible.",
      },
    ],
  },
  {
    id: "deep-cleaning",
    title: "Deep Cleaning",
    description: "What’s included, what’s not, and when to book a deep clean.",
    items: [
      {
        question: "What is deep cleaning?",
        answer:
          "Deep cleaning is for the times when your home needs more than its usual routine.\n\nIt goes beyond everyday upkeep and gives more time and attention to the areas where dirt, grease, limescale, dust or general build-up has had a chance to settle.\n\nThat might be the kitchen that has slowly become harder to keep on top of, the bathroom that needs more detailed attention, skirting boards that have not been touched in a while, or simply a home that has had a very busy few months.\n\nA deep clean is not about making your home look perfect for the sake of it.\nIt is about giving the space a proper reset so it feels easier to maintain afterwards.",
      },
      {
        question: "What is included in a deep clean?",
        answer:
          "A Mundoria deep clean is more detailed than a regular clean and can focus on the areas that need extra attention throughout the home.\n\nThat can include more thorough kitchen and bathroom cleaning, built-up grease, limescale, floors, accessible surfaces, skirting boards, doors and frames, detailed dusting, fixtures and other agreed areas.\n\nThe exact work depends on the size and condition of the property, the amount of time booked and what you want prioritised.\n\nWe do not want to pretend every deep clean looks exactly the same.\nOne home may need most of the attention in the kitchen and bathrooms. Another may need more detailed work across several rooms.\n\nThe booking should reflect the home in front of us.",
      },
      {
        question:
          "What is the difference between regular cleaning and deep cleaning?",
        answer:
          "Regular cleaning is about maintenance.\nDeep cleaning is about resetting the home when normal upkeep is no longer enough.\n\nA regular clean focuses on the everyday areas that help keep a home comfortable: kitchens, bathrooms, floors, dusting, surfaces and other routine tasks.\n\nA deep clean gives more time to the detail.\nIt is better suited to built-up dirt, grease, limescale, areas that have not been cleaned for some time and parts of the home that need more concentrated attention.\n\nA useful way to think about it is this:\nRegular cleaning helps stop the home from getting away from you.\nDeep cleaning helps bring it back when it already has.",
      },
      {
        question: "When should I book a deep clean?",
        answer:
          "A deep clean can make sense when your home feels like it needs a proper reset rather than a normal tidy-up.\n\nThat might be after a particularly busy period, before starting a regular cleaning routine, after months without detailed cleaning, before an important occasion or simply because certain areas have built up beyond what a standard clean can comfortably handle.\n\nYou do not need to wait until the home is in terrible condition.\nSometimes you simply want more attention than a regular clean is designed to provide.",
      },
      {
        question: "How often should I book a deep clean?",
        answer:
          "There is no fixed rule.\n\nSome people may only need one occasionally, while others choose to book one a few times a year alongside regular cleaning.\n\nIf your home is cleaned weekly or fortnightly and stays well maintained, deep cleaning may be something you only need from time to time.\nIf the home is not cleaned regularly, you may find deeper cleaning is needed more often.\n\nThe right frequency depends on the property, how it is used and how much detailed cleaning you do between visits.",
      },
      {
        question: "How long does a deep clean take?",
        answer:
          "Usually longer than a regular clean.\n\nHow much longer depends on the size of the property, its condition, the areas you want covered and how much build-up there is.\n\nA small flat that needs extra attention in the kitchen and bathroom may be very different from a larger family home that needs detailed work throughout.\n\nThat is why Mundoria asks about the property before the booking.\nWe would rather estimate the time based on what actually needs doing than pretend every deep clean can be completed in the same number of hours.",
      },
      {
        question: "How do I know how many hours of deep cleaning I need?",
        answer:
          "The booking information helps us estimate it.\n\nThings like the property size, number of rooms, bathrooms, condition of the home and areas you want prioritised all matter.\n\nIf the home has significant build-up, it may need more time than a property that is already fairly well maintained.\n\nThe aim is to give you a sensible estimate before the clean rather than discover halfway through that the job is much larger than expected.\nIf the available time is limited, the cleaner can focus on your priorities first.",
      },
      {
        question: "Can I book a deep clean before starting regular cleaning?",
        answer:
          "Yes, and in many cases that can make a lot of sense.\n\nIf the home needs a proper reset, starting with regular cleaning may not give enough time to deal with everything that has built up.\n\nA deep clean can bring the home back to a stronger baseline.\nThen regular weekly or fortnightly cleaning can help maintain it from there.\n\nIt is often easier to maintain a home once the heavier work has already been done.",
      },
      {
        question: "Can I choose which areas receive deeper attention?",
        answer:
          "Yes.\n\nYou may not need the same level of attention everywhere.\nPerhaps the kitchen and bathrooms are the main concern.\nPerhaps the floors, skirting boards and doors matter more.\nPerhaps one room has been neglected while the rest of the home is fine.\n\nTell us what matters most.\nThe cleaner can then use the booked time around those priorities rather than spreading the effort evenly across areas that do not need it.",
      },
      {
        question: "Does a deep clean include the kitchen?",
        answer:
          "Yes, the kitchen can be one of the main areas covered in a deep clean.\n\nThat may include more detailed cleaning of accessible surfaces, worktops, cupboard fronts, sinks, taps, floors, splashbacks and areas where grease or general build-up has developed.\n\nIf you want something more specific, such as the inside of cupboards or an oven, make sure that is included in the agreed scope rather than assuming it is automatic.",
      },
      {
        question: "Does a deep clean include bathrooms?",
        answer:
          "Yes.\n\nBathrooms are often one of the areas that benefit most from deep cleaning because soap residue, limescale and general build-up can accumulate gradually.\n\nA deep clean can give more attention to baths, showers, basins, taps, toilets, tiles, floors and other agreed bathroom surfaces.\n\nThe cleaner will use products appropriate for the surfaces being cleaned.",
      },
      {
        question: "Does a deep clean include skirting boards?",
        answer:
          "Yes, skirting boards can be included as part of a deep clean.\n\nThey are one of those areas that are easy to ignore during everyday cleaning, so dust and marks can build up over time.\n\nIf skirting boards are a particular priority, add that to the booking so the cleaner knows to allow time for them.",
      },
      {
        question: "Does a deep clean include doors and door frames?",
        answer:
          "Yes, they can be included.\n\nDoors, handles and frames often collect fingerprints, dust and marks that are not always part of a quick regular clean.\nA deep clean gives more opportunity to pay attention to those details.\n\nIf there are delicate finishes or surfaces that need special care, let us know beforehand.",
      },
      {
        question: "Does a deep clean include internal windows?",
        answer:
          "Internal glass can be included where it is safely accessible and part of the agreed booking.\n\nThis may include internal window glass, mirrors or other suitable glass surfaces.\n\nExternal window cleaning, high-level access or specialist window work is not part of Mundoria's current standard deep-clean service.",
      },
      {
        question: "Does a deep clean include limescale removal?",
        answer:
          "Light to moderate limescale can be part of a deep clean where it can be treated safely with normal household cleaning products.\n\nThis is particularly common around taps, shower screens and bathroom fittings.\n\nSevere or long-established limescale may not always be completely removable through ordinary cleaning.\nWe would rather be clear about that than promise a result that the surface or condition may not allow.",
      },
      {
        question: "Does a deep clean include built-up grease?",
        answer:
          "Yes, built-up household grease can be part of a deep clean, particularly in kitchens.\n\nThat may include suitable worktops, splashbacks, cupboard fronts, hob surrounds and other accessible areas where grease has accumulated.\n\nThe cleaner will use products appropriate to the surface.\nIf grease is extremely heavy or involves specialist commercial-style treatment, it may sit outside the standard residential deep-clean scope.",
      },
      {
        question: "Does a deep clean include oven cleaning?",
        answer:
          "Oven cleaning should only be treated as included where it has been specifically selected or agreed as part of the booking.\n\nWe do not want customers assuming every deep clean automatically includes the inside of the oven.\n\nIf you want the oven cleaned, include it when booking so the time and products needed can be properly considered.",
      },
      {
        question: "Does a deep clean include inside cupboards?",
        answer:
          "It can, but only where it has been agreed as part of the booking.\n\nCupboards normally need to be emptied first if you want the inside properly cleaned.\nIf they are full of food, crockery, clothes or other belongings, the cleaner should not be expected to remove and reorganise everything before cleaning.\n\nIf cupboard interiors matter to you, tell us in advance and make sure they are accessible.",
      },
      {
        question: "Does a deep clean include behind furniture?",
        answer:
          "Only where the area can be accessed safely.\n\nA cleaner may be able to move light items where practical, but heavy furniture such as large sofas, wardrobes, beds or cabinets should not be assumed to be part of a normal deep clean.\n\nWe do not want cleaners taking unnecessary risks by trying to move heavy objects.\nIf there is a particular area behind furniture you want cleaned, mention it before the booking so we can be realistic about access.",
      },
      {
        question: "Does a deep clean include specialist cleaning?",
        answer:
          "No.\n\nMundoria's residential deep cleaning is still household cleaning, just at a more detailed level.\nWe are not currently offering specialist cleaning services as part of the deep-clean package.\n\nThat means the service focuses on detailed cleaning using standard professional household products and equipment rather than specialist machinery or specialist remediation work.",
      },
      {
        question: "Does Mundoria offer carpet extraction?",
        answer:
          "Not currently.\n\nMundoria does not currently offer carpet extraction or machine-based carpet cleaning as a specialist service.\n\nStandard vacuuming can still form part of the clean, but specialist carpet treatment is outside our current service scope.",
      },
      {
        question: "Does Mundoria offer upholstery cleaning?",
        answer:
          "Not currently.\n\nWe do not currently offer specialist upholstery extraction or machine-based upholstery cleaning.\n\nThe cleaner may vacuum suitable upholstered surfaces where appropriate, but specialist fabric treatment is not part of the standard deep-clean service.",
      },
      {
        question: "Does Mundoria remove major mould?",
        answer:
          "No.\n\nMundoria does not currently offer major mould remediation.\n\nSmall amounts of ordinary surface mould may sometimes be treated as part of normal bathroom cleaning where it is safe and appropriate, but significant mould growth can involve moisture, structural or health issues that need specialist assessment and treatment.\n\nWe do not want cleaners attempting work that sits outside normal household cleaning.",
      },
      {
        question: "Does Mundoria offer biohazard cleaning?",
        answer:
          "No.\n\nBiohazard cleaning requires specialist procedures, training, protective equipment and disposal arrangements.\nIt is outside Mundoria's current service scope.\n\nIf a property contains blood, bodily fluids, hazardous waste or another serious contamination risk, a specialist provider should be used instead.",
      },
      {
        question: "Does Mundoria provide specialist floor treatment?",
        answer:
          "Not currently.\n\nStandard vacuuming, mopping and normal floor cleaning can be included where suitable for the flooring.\n\nSpecialist treatments such as floor stripping, polishing, restoration, sanding, machine scrubbing or other specialist floor work are not currently offered by Mundoria.",
      },
      {
        question: "What is not included in a Mundoria deep clean?",
        answer:
          "A Mundoria deep clean does not currently include specialist services such as carpet extraction, specialist upholstery cleaning, major mould remediation, biohazard cleaning, pest-related cleaning, specialist floor restoration or other work requiring specialist machinery or specialist remediation.\n\nHeavy furniture moving is also not something customers should assume is included.\n\nSome detailed tasks, such as oven interiors or inside cupboards, should be selected or agreed in advance rather than assumed to form part of every booking.\n\nThe simplest rule is this:\nIf something requires specialist machinery, specialist treatment or work outside normal residential cleaning, it is not currently part of Mundoria's deep-clean service.",
      },
      {
        question: "Do cleaners bring products for a deep clean?",
        answer:
          "They can, if you select the product-supply option.\n\nDeep cleaning generally requires a wider range of products than regular cleaning because the cleaner may need to deal with grease, limescale, detailed bathroom cleaning and other built-up dirt.\n\nIf Mundoria-supplied products are selected, the relevant additional charge will be shown as part of the booking.\nYou can also provide suitable products yourself if you prefer.\n\nIf you have allergies, sensitivities or products you do not want used, tell us before the clean.",
      },
      {
        question: "Do cleaners bring equipment for a deep clean?",
        answer:
          "They can, if you select the equipment-supply option.\n\nA deep clean may require standard equipment such as a vacuum cleaner with appropriate attachments, mop and bucket, microfibre cloths, scrubbing brushes, detail brushes, dusting tools and other normal deep-cleaning equipment.\n\nSpecialist machinery is not included because Mundoria is not currently offering specialist cleaning.\n\nIf you already have suitable equipment at the property, you can choose to provide it yourself.\nIf Mundoria equipment is requested, the relevant charge should be shown before the booking is confirmed.",
      },
    ],
  },
  {
    id: "one-off",
    title: "One-Off Cleaning",
    description: "Single visits without a recurring commitment.",
    items: [
      {
        question: "What is a one-off clean?",
        answer:
          "A one-off clean is exactly what it sounds like: cleaning you can book when you need it, without setting up an ongoing routine.\n\nYou might have had a particularly busy few weeks, be getting ready for visitors, coming back from holiday or simply want someone else to take care of the cleaning this time.\n\nThere is no expectation that one booking has to become weekly or fortnightly cleaning afterwards.\nSometimes you just need help once.\nAnd that is enough.",
      },
      {
        question: "What is included in a one-off clean?",
        answer:
          "A one-off clean can cover the everyday areas of the home that need attention, such as kitchens, bathrooms, bedrooms, living spaces, floors, dusting and accessible surfaces.\n\nWhat gets done depends on the amount of time booked and the areas you want prioritised.\n\nIf the home needs more detailed attention, you can choose a deeper one-off clean rather than trying to fit heavier work into a standard clean.\n\nThe idea is to match the clean to what the home actually needs that day.",
      },
      {
        question: "Who is one-off cleaning suitable for?",
        answer:
          "Anyone who wants help with cleaning without committing to a regular schedule.\n\nIt can be useful if life has become unusually busy, you are preparing for guests, you have had people staying over, you are returning from holiday or you simply want a reset.\n\nIt also works well for people who normally do their own cleaning but occasionally want a hand.\nYou do not need a special reason.\nIf you need the cleaning done once, one-off cleaning is there for exactly that.",
      },
      {
        question:
          "Can I book a one-off clean without committing to regular cleaning?",
        answer:
          "Yes.\n\nThere is no requirement to turn a one-off clean into a recurring booking.\nYou can book once, have the clean completed and leave it there.\n\nIf you later decide that regular cleaning would make life easier, you can always set that up afterwards.\nBut the first booking does not tie you into anything.",
      },
      {
        question: "Can I choose between standard and deep one-off cleaning?",
        answer:
          "Yes.\n\nIf your home mainly needs routine cleaning, a standard one-off clean may be enough.\nIf there is more build-up, heavier kitchen or bathroom work, limescale, grease or areas that have not been properly cleaned for some time, a deeper one-off clean may be more suitable.\n\nThe difference is not about making one service sound better than the other.\nIt is simply about how much attention the home needs.",
      },
      {
        question: "How long does a one-off clean take?",
        answer:
          "That depends on the size of the property, its condition and what you want done.\n\nA small flat with a few priority areas may take much less time than a larger home needing attention throughout.\n\nWhen you book, Mundoria uses the property details and your priorities to help estimate how much time may be needed.\nIf you only have a limited amount of time available, it is usually better to prioritise the most important areas rather than try to rush through everything.",
      },
      {
        question: "Can I choose which rooms are cleaned?",
        answer:
          "Yes.\n\nYou do not have to clean the whole property just because you are booking a one-off service.\nIf you only want the kitchen, bathrooms and living room cleaned, tell us.\nIf there are rooms you do not want entered, you can exclude those too.\n\nThe cleaner can focus the booked time on the areas that matter most to you.",
      },
      {
        question: "Can I turn a one-off booking into regular cleaning later?",
        answer:
          "Yes.\n\nA one-off clean can be a good way to see what works for you before deciding whether you want something more regular.\n\nIf you like the experience and decide you would rather not keep returning to the same cleaning jobs yourself, you can move into weekly or fortnightly cleaning later.\nYou can also decide that occasional one-off cleaning suits you better.\nThere is no single right routine.",
      },
      {
        question: "Can I book a one-off clean before guests arrive?",
        answer:
          "Yes.\n\nThat is one of the most common reasons people book one-off cleaning.\n\nYou might want the kitchen, bathrooms, floors and living areas freshened up before friends or family arrive, or you may simply want the house to feel ready without spending the previous day cleaning.\n\nIf guests are arriving at a particular time, book early enough to leave some breathing room between the clean and their arrival.\nThat way, the day does not depend on everything running to the last minute.",
      },
      {
        question: "Can I book a one-off clean after a party or event?",
        answer:
          "Yes.\n\nA one-off clean can be useful after a gathering, celebration or event when the home simply needs more attention than usual.\n\nTell us what has happened and which areas need the most work so the booking can be estimated properly.\n\nOrdinary household cleaning can be covered, but anything involving hazardous waste, bodily fluids or specialist contamination would fall outside Mundoria's normal cleaning scope.",
      },
      {
        question: "Can I book a one-off clean after returning from holiday?",
        answer:
          "Yes.\n\nComing home from a trip often means unpacking, washing, getting back into work and trying to remember what day it is.\nCleaning does not have to be the first thing on that list.\n\nYou can arrange a one-off clean after you return, or book one before you come home if suitable access has been arranged.\n\nEither way, the idea is simple: come back to the space with one less thing waiting for you.",
      },
    ],
  },
  {
    id: "apartment",
    title: "Apartment & Flat Cleaning",
    description: "Flats, studios, access and high-rise considerations.",
    items: [
      {
        question: "Do you clean flats and apartments?",
        answer:
          "Yes.\n\nMundoria can be used for flats, apartments and other self-contained homes, whether you need regular cleaning, a one-off clean, a deep clean or cleaning around a move.\n\nThe booking is shaped around the actual space rather than assuming every home works the same way.\nA one-bedroom flat may need a very different amount of time from a large apartment with multiple bathrooms, open-plan living areas or several occupants.\n\nWhat matters is giving us an accurate picture of the property so the clean can be estimated properly.",
      },
      {
        question: "Is apartment cleaning different from house cleaning?",
        answer:
          "The cleaning itself is often similar, but the way the property works can be different.\n\nApartments may have shared entrances, lifts, concierge desks, parking restrictions, building access codes or rules about when contractors can enter.\n\nSome flats are compact and quick to move around. Others are large, high-rise properties where access takes longer and parking is limited.\n\nThat is why Mundoria treats the property details as part of the booking, not just the number of bedrooms.\nThe aim is to understand the whole job, including how the cleaner actually gets in and works there.",
      },
      {
        question: "Do you clean studio flats?",
        answer:
          "Yes.\n\nStudio flats can be booked just like other homes.\n\nBecause the space is usually smaller, the amount of cleaning time may be lower, but that still depends on the condition of the property and what you want done.\n\nA studio that is regularly maintained may need relatively little time.\nA studio needing a deep clean may still require more attention, especially in the kitchen and bathroom.\n\nSize matters, but condition matters too.",
      },
      {
        question: "Do you clean high-rise apartments?",
        answer:
          "Yes, where the building can be accessed safely and the booking is practical.\n\nIf the apartment is in a high-rise building, let us know anything that affects access, such as concierge procedures, lift access, visitor registration, parking restrictions or a particular entrance that needs to be used.\n\nThose details may sound small, but they can make a big difference on the day.\nThe cleaner should not be spending the first part of the booking trying to work out how to get into the building.",
      },
      {
        question: "What if my building has concierge access?",
        answer:
          "That is fine.\n\nIf the concierge needs to let the cleaner in, hold a key, register visitors or provide lift access, include that information in the booking.\n\nIt also helps to let the concierge know in advance that a cleaning professional is expected.\nIf they need the cleaner's name or booking details before allowing access, make sure that is arranged beforehand.\n\nA few minutes of preparation can prevent a lot of confusion at reception.",
      },
      {
        question: "What if parking is difficult at my apartment?",
        answer:
          "Tell us before the booking.\n\nParking can affect whether a particular professional is a practical match for the job, especially if they are bringing equipment.\n\nIf there is visitor parking, a permit system, nearby paid parking or a loading area, include those details where possible.\nIf there is no practical parking at all, that is still useful for us to know.\n\nIt is much better to consider travel and access when arranging the booking than for the cleaner to discover the problem after arriving.",
      },
      {
        question: "Can a cleaner collect access keys from reception?",
        answer:
          "Yes, if reception or concierge staff are authorised to release the key and the arrangement has been agreed beforehand.\n\nInclude clear instructions about where the key will be, who can release it and where it should be returned after the clean.\n\nIf the cleaner needs identification or booking information to collect the key, let us know.\nThe simpler the handover, the easier it is for the cleaning time to be spent on the property rather than on access.",
      },
      {
        question: "Can I book regular apartment cleaning?",
        answer:
          "Yes.\n\nRegular apartment cleaning can be arranged weekly or fortnightly, depending on what works for you and what availability looks like in your area.\n\nIt can cover the everyday areas that need ongoing attention, such as the kitchen, bathroom, floors, bedrooms, living spaces and accessible surfaces.\n\nYou can also tell us which areas matter most.\nIf you live alone and barely use one room, there is no reason it needs the same attention as the kitchen you use every day.\nThe cleaning should reflect the way you actually live in the space.",
      },
      {
        question: "Can I book deep apartment cleaning?",
        answer:
          "Yes.\n\nA deep clean can be useful if the apartment needs more than normal upkeep.\nThat might mean built-up grease in the kitchen, limescale in the bathroom, detailed cleaning around skirting boards and doors, or simply a property that has not had a thorough clean for some time.\n\nThe same rules around specialist cleaning still apply.\nMundoria deep cleaning covers detailed household cleaning, but not specialist services such as carpet extraction, major mould remediation, biohazard cleaning or specialist floor restoration.",
      },
      {
        question: "Can I book move-in or move-out cleaning for a flat?",
        answer:
          "Yes.\n\nMove-in, move-out and end-of-tenancy cleaning can all be booked for flats and apartments.\n\nIf you are moving in, the clean can be arranged before your belongings arrive where access allows.\nIf you are moving out, it is usually easier to clean once most or all of your belongings have been removed.\n\nFor flats, access details are particularly important because the cleaner may need to deal with building reception, lifts, key collection, parking or estate-agent arrangements.\n\nMoving already comes with enough moving parts.\nThe cleaning should be one of the simpler ones.",
      },
    ],
  },
  {
    id: "moving",
    title: "Moving Cleaning",
    description: "Move-in, move-out and end-of-tenancy cleans.",
    items: [
      {
        question: "What is move-in cleaning?",
        answer:
          "Move-in cleaning is for getting a property ready before you properly settle into it.\n\nIt is usually easier to clean a home thoroughly before boxes, furniture and everyday life start filling the space. That gives the cleaner better access to floors, cupboards, bathrooms, kitchens and other areas that can become harder to reach later.\n\nYou might be moving into a rented flat, a new house or a property that has recently been vacated.\n\nThe aim is simple: to make the space feel properly ready for you to start living in it.",
      },
      {
        question: "What is move-out cleaning?",
        answer:
          "Move-out cleaning is for the property you are leaving behind.\n\nIt is designed to help bring the home back into good order once most or all of your belongings have been removed.\n\nThe clean can focus on the kitchen, bathrooms, floors, accessible surfaces, cupboards and other agreed areas that need attention before the property is handed over.\n\nIt is particularly useful if you want to leave the home in a better condition without trying to fit a full clean into an already busy moving day.",
      },
      {
        question: "What is end-of-tenancy cleaning?",
        answer:
          "End-of-tenancy cleaning is a more detailed clean for rented properties being prepared for handover at the end of a tenancy.\n\nIt usually goes further than a normal move-out clean because the property is being prepared for inspection by a landlord or letting agent.\n\nThat can mean more detailed attention across kitchens, bathrooms, floors, skirting boards, doors, cupboard interiors, accessible surfaces and other agreed areas.\n\nThe exact scope should be clear before the booking so there is no confusion about what is and is not included.",
      },
      {
        question: "What is included in move-in cleaning?",
        answer:
          "Move-in cleaning can cover the areas you want prepared before you settle into the property.\n\nThat may include kitchens, bathrooms, floors, bedrooms, living spaces, cupboard interiors where empty, accessible surfaces, skirting boards, doors and other agreed areas.\n\nBecause the property may be empty, the cleaner often has better access than they would during a normal occupied-home clean.\nIf there are particular areas you want prioritised before your belongings arrive, tell us when booking.",
      },
      {
        question: "What is included in move-out cleaning?",
        answer:
          "Move-out cleaning can cover the areas that need attention before you leave the property behind.\n\nThat may include kitchens, bathrooms, floors, accessible surfaces, cupboards where empty, doors, skirting boards and other agreed areas.\n\nThe exact priorities depend on the condition of the property and how much time is booked.\nIf you are moving out under a tenancy and the property needs to meet a landlord or agent's handover standard, end-of-tenancy cleaning may be the more suitable service.",
      },
      {
        question: "What is included in end-of-tenancy cleaning?",
        answer:
          "End-of-tenancy cleaning is designed to be more detailed than normal home cleaning.\n\nIt can include kitchens, bathrooms, floors, skirting boards, doors and frames, cupboard interiors where empty, accessible surfaces, fixtures and other areas agreed as part of the booking.\n\nThe property should ideally be mostly or completely empty so the cleaner can access as much of the space as possible.\n\nSome tasks, such as oven interiors, should be specifically selected or agreed rather than assumed to be included automatically.\nMundoria does not currently offer specialist services such as carpet extraction, major mould remediation, biohazard cleaning or specialist floor restoration.",
      },
      {
        question:
          "What is the difference between move-out cleaning and end-of-tenancy cleaning?",
        answer:
          "Move-out cleaning is for anyone leaving a property and wanting it properly cleaned before they go.\nEnd-of-tenancy cleaning is specifically designed around a rented property being prepared for handover.\n\nThe main difference is the level of detail and the reason for the clean.\nA move-out clean may simply be about leaving the property in good order.\nAn end-of-tenancy clean usually needs more detailed attention because the property may be inspected by a landlord or letting agent.",
      },
      {
        question:
          "What is the difference between deep cleaning and end-of-tenancy cleaning?",
        answer:
          "A deep clean is usually for a home that is still being lived in.\nEnd-of-tenancy cleaning is for a property being prepared for handover at the end of a tenancy.\n\nA deep clean focuses on detailed cleaning around the way the home is currently being used.\nAn end-of-tenancy clean is more focused on the condition of the whole property before it is returned.\n\nIn practice, some of the cleaning tasks may overlap, but the purpose of the booking is different.",
      },
      {
        question: "Should the property be empty for an end-of-tenancy clean?",
        answer:
          "Ideally, yes.\n\nAn empty property gives the cleaner better access to floors, cupboards, skirting boards, corners and other areas that may otherwise be blocked by furniture and belongings.\nIt also reduces the risk of personal items being moved or missed.\n\nIf the property cannot be completely empty, let us know what will still be there so the booking can be planned realistically.",
      },
      {
        question: "Can you clean while my belongings are still in the property?",
        answer:
          "Yes, but it may affect what can be cleaned properly.\n\nIf boxes, furniture and personal belongings are still covering floors, surfaces or cupboards, the cleaner may need to work around them.\n\nFor move-out and end-of-tenancy cleaning, the more of the property that is clear, the more thorough the clean can be.\nIf some belongings will remain, tell us in advance.",
      },
      {
        question: "Should cupboards be empty before cleaning?",
        answer:
          "Yes, if you want the inside of the cupboards cleaned.\n\nThe cleaner should not be expected to remove food, crockery, clothes or personal belongings and decide where to put them.\n\nEmptying cupboards beforehand allows the cleaner to clean the interior properly and return the space ready for handover or move-in.",
      },
      {
        question: "Can I book cleaning before I collect the keys?",
        answer:
          "Yes, you can arrange the booking in advance.\n\nThe important thing is that someone can provide access at the agreed time.\nThat might be an estate agent, landlord, concierge or another authorised person.\n\nIf the cleaner needs to collect keys from somewhere else, include that information before the booking so travel and timing can be considered properly.",
      },
      {
        question: "Can I book a move-in clean before furniture arrives?",
        answer:
          "Yes, and that is often one of the best times to do it.\n\nAn empty property gives the cleaner much better access to floors, skirting boards, cupboards and other areas that may be hidden once furniture and boxes arrive.\n\nIf your schedule allows it, arranging the clean before moving everything in can make the whole process easier.",
      },
      {
        question: "Can I book a move-out clean on moving day?",
        answer:
          "Yes, but timing matters.\n\nMoving day can already be unpredictable, especially if removals take longer than expected.\nThe property ideally needs to be clear enough for the cleaner to work properly before the booking starts.\n\nIf boxes and furniture are still being moved during the clean, it can slow things down and make some areas difficult to access.\nWhere possible, leave enough time between the removal of your belongings and the cleaning appointment.",
      },
      {
        question: "Can the cleaner collect keys from my estate agent?",
        answer:
          "Yes, where the arrangement is practical and agreed beforehand.\n\nWe will need to know where the keys are being collected, when the office is open and whether the cleaner needs identification or booking information.\n\nIf the estate agent is some distance from the property, that also needs to be considered because key collection takes time.\nIt should never be left as a surprise for the cleaner on arrival.",
      },
      {
        question: "Can the cleaner leave keys with my landlord or agent?",
        answer:
          "Yes, where that has been clearly agreed.\n\nYou can provide instructions about where the keys should be returned once the clean is complete.\nThat could be a landlord, letting agent, reception desk or another authorised person.\n\nMake sure the handover arrangement is clear and available at the time the cleaner finishes.",
      },
      {
        question: "Does end-of-tenancy cleaning guarantee my deposit back?",
        answer:
          "No.\n\nMundoria cannot guarantee the return of your deposit because that decision is not ours to make.\nYour landlord, letting agent and the relevant tenancy or deposit process may consider many things beyond cleaning, including damage, missing items, rent arrears or the general condition of the property.\n\nWhat Mundoria can do is provide detailed cleaning designed to help prepare the property for handover.\nWe would rather be clear about that than use a \"deposit guaranteed\" promise we cannot control.",
      },
      {
        question: "Can Mundoria clean a property after tenants move out?",
        answer:
          "Yes.\n\nLandlords, letting agents and property managers can arrange cleaning after tenants have vacated.\n\nAn empty property is often easier to assess and clean because the cleaner has clearer access to the areas that need attention.\nThe booking should still describe the condition of the property accurately so the right amount of time can be planned.",
      },
      {
        question: "Can landlords or letting agents book Mundoria?",
        answer:
          "Yes.\n\nLandlords and letting agents can use Mundoria for move-in, move-out and end-of-tenancy cleaning where the service fits the property.\n\nYou can provide property details, access arrangements and the areas that need attention when making the booking.\nIf you manage several properties, each booking should still reflect the actual condition and requirements of that particular property.",
      },
      {
        question: "Can property managers book Mundoria?",
        answer:
          "Yes.\n\nProperty managers can arrange cleaning for individual properties or suitable managed spaces.\n\nThe important thing is that access, property details and the required cleaning scope are clear before the booking.\nFor repeat work, having accurate property information can also make future bookings easier to arrange.",
      },
      {
        question: "How long does an end-of-tenancy clean take?",
        answer:
          "It depends on the size and condition of the property.\n\nA small flat that has been well maintained may take considerably less time than a large house with several bathrooms, heavy kitchen build-up and detailed work throughout.\n\nThat is why Mundoria uses the information provided about the property to help estimate the time required.\nEnd-of-tenancy cleaning generally takes longer than a routine clean because more areas need detailed attention.",
      },
      {
        question:
          "Do I need to book a deep clean as well as end-of-tenancy cleaning?",
        answer:
          "Usually, no.\n\nEnd-of-tenancy cleaning is already intended to be a detailed cleaning service.\nYou should not need to book a separate deep clean on top of it simply to achieve the expected level of attention.\n\nIf there are unusual areas or additional tasks you want included, it is better to add those requirements to the end-of-tenancy booking rather than paying for two overlapping services.",
      },
      {
        question: "Are products and equipment included in moving cleaning?",
        answer:
          "That depends on the option selected when booking.\n\nYou may provide suitable products and equipment at the property, or choose Mundoria-supplied products and equipment where available.\nIf Mundoria is supplying them, any additional charge should be shown before the booking is confirmed.\n\nBecause moving cleans can require more detailed work, it is important that the cleaner has suitable products and standard equipment for the agreed tasks.\nSpecialist machinery is not currently part of Mundoria's service.",
      },
      {
        question:
          "Can I book cleaning for both the property I am leaving and the one I am moving into?",
        answer:
          "Yes.\n\nYou may want a move-out or end-of-tenancy clean at your old property and a move-in clean at the new one.\n\nThese should normally be treated as separate bookings because they involve two different properties, access arrangements, time requirements and potentially different cleaning professionals.\n\nYou can still arrange both through Mundoria.\nMoving already gives you enough to coordinate.\nHaving both cleans organised in one place should make that part of the move a little easier.",
      },
    ],
  },
  {
    id: "office",
    title: "Office Cleaning",
    description: "Regular and deep cleans for workplaces.",
    items: [
      {
        question: "Does Mundoria clean offices?",
        answer:
          "Yes.\n\nMundoria can be used for regular office cleaning, one-off office cleaning and deeper office cleaning, depending on what the workplace needs.\n\nThat might be a small office used by a handful of people, a larger workplace with meeting rooms and shared facilities, or a site that needs cleaning around opening hours rather than during the working day.\n\nThe booking should reflect how the office actually works, not force every workplace into the same routine.",
      },
      {
        question: "What is regular office cleaning?",
        answer:
          "Regular office cleaning is ongoing cleaning designed to keep a workplace consistently looked after.\n\nIt usually focuses on the areas that are used every day, such as desks and accessible surfaces, floors, kitchens, toilets, reception areas, meeting rooms and bins.\n\nThe idea is not to wait until the office looks tired.\nIt is to keep the space at a comfortable, presentable standard through a regular schedule.\n\nDepending on the workplace, that might mean daily cleaning, several visits a week or a weekly clean.",
      },
      {
        question: "What is office deep cleaning?",
        answer:
          "Office deep cleaning is a more detailed clean for workplaces that need more than their normal routine.\n\nIt can be useful where there is heavier build-up, where certain areas have not had detailed attention for some time, or when the office needs a proper reset.\n\nThat may include more detailed work around kitchens, washrooms, skirting boards, doors, frames, fixtures, high-touch areas and other agreed parts of the workplace.\n\nIt is still commercial cleaning, but with more time and attention given to the detail.",
      },
      {
        question: "What is included in regular office cleaning?",
        answer:
          "Regular office cleaning can include the everyday areas needed to keep the workplace in good order.\n\nThat may include accessible desks and surfaces, meeting rooms, reception areas, staff kitchens, toilets and washrooms, floors, communal spaces, bins and agreed high-touch areas.\n\nThe exact scope should be agreed around the site.\nOne office may need more attention in shared kitchens and toilets. Another may care most about client-facing areas such as reception and meeting rooms.\n\nThe point is to create a routine that fits how the workplace is actually used.",
      },
      {
        question: "What is included in office deep cleaning?",
        answer:
          "Office deep cleaning can include more detailed attention to the parts of the workplace that routine cleaning may not cover as thoroughly every time.\n\nThat may include built-up dirt, heavier kitchen cleaning, washroom detail, doors and frames, skirting boards, fixtures, edges, accessible surfaces, high-touch areas and other agreed areas.\n\nThe exact scope depends on the size and condition of the office and what you want prioritised.\nDeep cleaning does not automatically include specialist commercial services or specialist machinery.",
      },
      {
        question:
          "What is the difference between regular office cleaning and office deep cleaning?",
        answer:
          "Regular office cleaning is about maintenance.\nOffice deep cleaning is about giving the workplace a more detailed reset.\n\nA regular clean keeps on top of the areas people use every day.\nA deep clean goes further into the detail, particularly where dirt, grease, limescale or general build-up has had more time to settle.\n\nThink of regular cleaning as keeping the office running comfortably.\nThink of deep cleaning as bringing the space back up when it needs more attention than the normal routine provides.",
      },
      {
        question: "How often should an office be cleaned?",
        answer:
          "There is no single answer that suits every office.\n\nA busy workplace with lots of staff, shared toilets, kitchens and regular visitors may need cleaning every day.\nA smaller office used by only a few people may be perfectly comfortable with cleaning once or twice a week.\n\nThe right frequency depends on things like staff numbers, footfall, the type of workplace, how often shared facilities are used and the standard you want to maintain.\nWe would rather recommend a schedule around the actual office than automatically suggest the most frequent option.",
      },
      {
        question: "Can I book daily office cleaning?",
        answer:
          "Yes, where suitable availability exists.\n\nDaily cleaning can work well for offices with higher footfall, larger teams, busy washrooms, shared kitchens or regular visitors.\nA daily schedule also helps stop smaller jobs from building into larger ones.\n\nThe exact routine can be agreed around the parts of the office that need attention each day.",
      },
      {
        question: "Can I book weekly office cleaning?",
        answer:
          "Yes.\n\nWeekly cleaning can suit smaller workplaces or offices with relatively low daily use.\nIf the office remains tidy and shared facilities are lightly used, one scheduled visit each week may be enough.\n\nIf certain areas begin to need attention more often, the schedule can be reviewed rather than assuming the first arrangement has to stay forever.",
      },
      {
        question: "Can cleaning take place outside office hours?",
        answer:
          "Yes, where access and professional availability allow.\n\nMany businesses prefer cleaning before staff arrive or after the working day because it reduces disruption.\n\nIf you want cleaning outside normal office hours, provide clear access instructions and let us know about alarms, security, reception procedures or anything else the professional needs to understand.\nThe cleaner should be able to enter, work and leave safely without having to guess how the building operates.",
      },
      {
        question: "Can cleaning take place while employees are working?",
        answer:
          "Yes.\n\nNot every office needs to be empty for cleaning to happen.\nIf staff are present, the professional can usually work around occupied areas and complete tasks in an order that causes as little disruption as possible.\n\nIf there are meetings, calls or particular rooms that should be avoided at certain times, include that information in the booking.\nThe goal is to keep the workplace clean without making the cleaning itself a problem.",
      },
      {
        question: "Can cleaning take place early in the morning?",
        answer:
          "Yes, where that time is available and access can be arranged.\n\nEarly-morning cleaning can work well for businesses that want the office ready before staff or customers arrive.\n\nMake sure any security, reception or building-access arrangements work at that time.\nIf the building is not normally open early, that needs to be agreed in advance.",
      },
      {
        question: "Can cleaning take place in the evening?",
        answer:
          "Yes.\n\nEvening cleaning can be a practical option for offices that want the work done after staff have left.\n\nAs with any out-of-hours booking, access, alarms, security procedures and building closing times should be clear before the booking begins.",
      },
      {
        question: "How is office cleaning priced?",
        answer:
          "Office cleaning is generally priced around the amount of cleaning time required, the type of service and any products or equipment supplied.\n\nRegular office cleaning starts from the relevant commercial rate, while office deep cleaning is priced higher because it requires more detailed work and usually more time.\n\nLarger or more complex workplaces may be better assessed through an estimated total based on the expected cleaner-hours rather than looking only at a single hourly figure.\nThe important thing is that the basis of the price should make sense before the booking is confirmed.",
      },
      {
        question:
          "How do you estimate how many cleaning hours an office needs?",
        answer:
          "We look at the size and layout of the office, the number of rooms, toilets, kitchens, meeting rooms and shared spaces, as well as how heavily the workplace is used.\n\nThe condition of the site also matters.\nA small, well-maintained office may need relatively little time.\nA larger workplace with several washrooms, kitchens and busy communal spaces will naturally need more.\n\nFor bigger sites, we may also consider whether the work is better carried out by more than one professional rather than simply extending one person's shift.",
      },
      {
        question: "Do commercial cleaners bring products?",
        answer:
          "They can, if the product-supply option is selected.\n\nFor commercial cleaning, the products required may include suitable multi-surface cleaner, disinfectant, glass cleaner, floor cleaner, bathroom products, limescale remover, kitchen degreaser and other standard products needed for the agreed work.\n\nYou can also provide suitable products at the workplace if you prefer.\nIf there are product restrictions, allergies or site-specific requirements, tell us beforehand.",
      },
      {
        question: "Do commercial cleaners bring equipment?",
        answer:
          "They can, if the equipment-supply option is selected.\n\nStandard commercial cleaning equipment may include a suitable vacuum cleaner, mop and bucket, flat mop, microfibre cloths, dusting tools, squeegee, brushes, bin bags and wet-floor warning signs.\n\nSpecialist machinery is not part of Mundoria's current standard commercial cleaning service.\nIf the workplace already has suitable equipment, you can choose to provide it.",
      },
      {
        question: "Can we provide our own products and equipment?",
        answer:
          "Yes.\n\nIf your workplace already has suitable cleaning products and equipment on site, the professional can use them where appropriate.\n\nMake sure everything needed for the agreed work is available, safe to use and in working condition.\nIf something important is missing, it may affect what can be completed during the booked time.",
      },
      {
        question: "Can Mundoria clean meeting rooms?",
        answer:
          "Yes.\n\nMeeting rooms can be included in the office-cleaning schedule.\nThat may include accessible surfaces, floors, tables, chairs and other agreed areas.\n\nIf a room has confidential documents, delicate equipment or anything that should not be moved, make that clear in the booking.",
      },
      {
        question: "Can Mundoria clean office kitchens?",
        answer:
          "Yes.\n\nOffice kitchens and break areas can be included.\nRegular cleaning may cover worktops, sinks, accessible surfaces, cupboard fronts, floors and other routine areas.\nMore detailed kitchen work may be included as part of an office deep clean where agreed.\n\nPersonal food, crockery and belongings should not be assumed to be part of the cleaning unless that has been specifically arranged.",
      },
      {
        question: "Can Mundoria clean toilets and washrooms?",
        answer:
          "Yes.\n\nToilets and washrooms are usually one of the most important parts of a commercial cleaning routine.\nCleaning can include toilets, basins, taps, floors, mirrors and other agreed surfaces.\n\nFor busy workplaces, washrooms may need more frequent attention than other areas of the office.\nThe cleaning schedule should reflect that rather than treating every part of the building exactly the same.",
      },
      {
        question: "Can Mundoria clean receptions and waiting areas?",
        answer:
          "Yes.\n\nReception and waiting areas are often the first parts of a workplace that staff, visitors and customers see, so they can be included as a priority area.\n\nCleaning may cover accessible surfaces, floors, seating areas and other agreed touchpoints.\nIf your reception needs to be ready before the business opens, that can be considered when arranging the schedule.",
      },
      {
        question: "Can Mundoria clean communal workspaces?",
        answer:
          "Yes.\n\nShared desks, breakout areas, collaborative spaces and other communal areas can be included in the cleaning plan.\n\nBecause these spaces are used by several people, they may need more regular attention than private offices.\nIf particular desks or equipment should not be touched, make that clear before the clean.",
      },
      {
        question: "Can Mundoria empty office bins?",
        answer:
          "Yes.\n\nEmptying ordinary office waste bins can form part of regular commercial cleaning.\nIf your workplace has specific waste-separation requirements, recycling rules or designated disposal points, provide those instructions.\n\nHazardous, clinical or specialist waste is outside Mundoria's normal commercial cleaning scope.",
      },
      {
        question: "Can Mundoria clean high-touch areas?",
        answer:
          "Yes.\n\nHigh-touch areas such as door handles, light switches, shared surfaces and other frequently used points can be included in the agreed cleaning routine.\n\nHow often they are cleaned can depend on the type of workplace and how heavily the area is used.",
      },
      {
        question: "Can Mundoria clean carpets?",
        answer:
          "Standard vacuuming can be included.\n\nMundoria does not currently offer specialist carpet extraction or machine-based carpet cleaning.\n\nIf carpets need normal vacuuming as part of the office clean, that is within scope.\nIf they require stain extraction, deep machine cleaning or specialist restoration, you would need a specialist provider.",
      },
      {
        question: "Does Mundoria offer specialist commercial cleaning?",
        answer:
          "Not currently.\n\nMundoria's commercial services focus on standard and deep workplace cleaning using suitable everyday commercial products and equipment.\nWe are not currently offering specialist services such as carpet extraction, upholstery extraction, industrial floor restoration, biohazard cleaning, specialist decontamination or major mould remediation.\n\nWe would rather be clear about what we do well than pretend every type of commercial cleaning sits under one service.",
      },
      {
        question: "Can Mundoria provide recurring commercial cleaning?",
        answer:
          "Yes.\n\nRecurring cleaning can be arranged around the needs of the workplace and available professionals.\nThat might mean daily, several times a week, weekly or another suitable routine.\n\nFor ongoing cleaning, the schedule can also be reviewed if the office changes.\nA growing team, more visitors or heavier use of shared facilities may mean the original routine eventually needs adjusting.",
      },
      {
        question:
          "Can Mundoria create a cleaning schedule around our opening hours?",
        answer:
          "Yes.\n\nThat is exactly how commercial cleaning should be approached.\nA workplace that opens to customers at 8am has different needs from an office that is empty after 6pm.\n\nTell us your opening hours, busy periods, access restrictions and any times when cleaning would be disruptive.\nFrom there, the booking can be arranged around what is practical for the business.\n\nThe aim is not simply to fit cleaning into an available slot.\nIt is to make it fit around the way the workplace actually runs.",
      },
    ],
  },
  {
    id: "retail-hospitality",
    title: "Retail & Hospitality Cleaning",
    description: "Shops, cafés and customer-facing spaces.",
    items: [
      {
        question: "Does Mundoria clean retail spaces?",
        answer:
          "Yes.\n\nMundoria can be used for retail spaces that need regular cleaning, one-off cleaning or a deeper clean.\n\nThat could include smaller independent shops, larger retail units, customer-facing spaces, staff areas, entrances, floors, toilets and other agreed parts of the premises.\n\nThe cleaning should be arranged around how the space is actually used, not around a generic commercial checklist.",
      },
      {
        question: "Does Mundoria clean shops?",
        answer:
          "Yes.\n\nShops can be cleaned before opening, after closing or at another suitable time, depending on access and availability.\n\nThe clean can focus on the areas customers see first, such as entrances, floors, counters, fitting-room areas and other agreed spaces, as well as staff areas behind the scenes.\n\nIf there are displays, stock, fragile items or areas that should not be moved or touched, tell us before the booking.",
      },
      {
        question: "Does Mundoria clean cafés?",
        answer:
          "Yes, within Mundoria's standard commercial cleaning scope.\n\nThat can include customer seating areas, floors, accessible surfaces, toilets, entrances and staff areas.\n\nKitchen or food-preparation areas can also be included where the work falls within normal cleaning and the site has made clear what can and cannot be touched.\n\nMundoria is not currently offering specialist kitchen extraction, grease-trap, duct or other specialist hospitality cleaning.",
      },
      {
        question: "Does Mundoria clean hospitality premises?",
        answer:
          "Yes.\n\nMundoria can support suitable hospitality spaces with regular cleaning, one-off cleaning and deeper cleaning.\n\nThat may include cafés, smaller hospitality venues, shared customer areas, toilets, entrances, staff spaces and other agreed parts of the premises.\n\nBecause hospitality businesses can vary a lot, the booking should reflect the actual site, opening hours, footfall and areas that need attention.",
      },
      {
        question: "Can cleaning happen before opening?",
        answer:
          "Yes, where suitable access and professional availability are in place.\n\nFor many retail and hospitality businesses, cleaning before opening can be a practical option because the space can be prepared before customers arrive.\n\nIf the cleaner needs to enter before normal opening hours, access arrangements, alarms, security procedures and any building restrictions should be made clear beforehand.\n\nThe aim is for the site to be ready without the cleaning getting in the way of the working day.",
      },
      {
        question: "Can cleaning happen after closing?",
        answer:
          "Yes.\n\nAfter-hours cleaning can work well for businesses that prefer the clean to happen once customers and staff have left.\n\nAs with any out-of-hours booking, the cleaner needs clear instructions about access, alarms, locking up and any parts of the premises that should not be entered.\n\nIf the business is inside a shopping centre or shared building, any building-specific rules also need to be considered.",
      },
      {
        question: "Can Mundoria clean customer-facing areas?",
        answer:
          "Yes.\n\nCustomer-facing areas are often some of the most important parts of a retail or hospitality clean.\n\nThat can include entrances, floors, counters, waiting areas, seating areas, accessible surfaces and other agreed spaces customers regularly see or use.\n\nThese areas may need more frequent attention because they directly affect how the space feels to people walking in.",
      },
      {
        question: "Can Mundoria clean staff areas?",
        answer:
          "Yes.\n\nStaff rooms, break areas, back-office spaces, staff kitchens and other agreed areas can be included.\n\nThese areas may not be visible to customers, but they still matter to the people working there every day.\n\nIf there are lockers, personal belongings or restricted areas, make clear what should and should not be cleaned.",
      },
      {
        question: "Can Mundoria clean toilets and washrooms?",
        answer:
          "Yes.\n\nToilets and washrooms can form part of regular retail and hospitality cleaning.\n\nThat may include toilets, basins, taps, mirrors, floors and other agreed surfaces.\n\nFor busier sites, washrooms may need more frequent attention than other areas.\n\nThe cleaning schedule should reflect actual use rather than assuming every part of the premises needs the same routine.",
      },
      {
        question: "Can Mundoria clean floors and entrances?",
        answer:
          "Yes.\n\nFloors and entrances are often high-traffic areas, so they can be included as a priority part of the cleaning routine.\n\nStandard vacuuming, sweeping and mopping can be covered where suitable for the surface.\n\nMundoria does not currently provide specialist floor restoration, polishing or other machine-based specialist floor treatment.\n\nIf entrances are affected by heavy footfall, rain or seasonal dirt, the cleaning frequency may need to be adjusted accordingly.",
      },
      {
        question: "Can Mundoria provide recurring retail cleaning?",
        answer:
          "Yes.\n\nRecurring cleaning can be arranged around the way the business operates.\n\nThat might mean daily cleaning, several visits a week, weekly cleaning or another suitable schedule.\n\nA busy shop or café may need more frequent cleaning than a quieter premises.\n\nThe right schedule should be based on actual footfall, opening hours, the size of the space and which areas are used most.",
      },
      {
        question: "Can Mundoria provide one-off deep cleaning for retail spaces?",
        answer:
          "Yes.\n\nA deeper one-off clean can be useful when the premises need more attention than the normal routine provides.\n\nThat might include built-up dirt, more detailed work around floors, toilets, staff areas, entrances, fixtures, doors, skirting and other agreed areas.\n\nIt can also make sense before reopening, after a busy period or when the site simply needs a reset.\n\nSpecialist commercial cleaning, such as industrial floor restoration, specialist extraction, biohazard cleaning or major mould remediation, is not currently part of Mundoria's service.",
      },
      {
        question: "How is retail and hospitality cleaning priced?",
        answer:
          "Pricing depends on the type of clean, the size of the premises, how much time is likely to be needed and whether products or equipment are being supplied.\n\nA small retail unit that needs routine weekly cleaning is a very different job from a larger hospitality space with customer areas, washrooms and heavier daily footfall.\n\nFor that reason, Mundoria can estimate the cleaner-hours required rather than treating every premises as though it should cost the same.\n\nRegular retail and hospitality cleaning starts from the relevant commercial rate, while deeper cleaning is priced higher because it requires more detailed work and usually more time.\n\nThe aim is for the price to make sense against the work involved, rather than feel like a number pulled from nowhere.",
      },
    ],
  },
  {
    id: "educational",
    title: "Educational Facility Cleaning",
    description: "Schools, classrooms and learning spaces.",
    items: [
      {
        question: "Does Mundoria clean educational facilities?",
        answer:
          "Yes.\n\nMundoria can provide cleaning for suitable educational spaces where the work falls within our normal commercial cleaning scope.\n\nThat can include routine cleaning, recurring cleaning and deeper cleaning for areas used by students, staff and visitors.\n\nBecause educational environments can be busy and sensitive spaces, the booking needs to reflect how the site actually operates, including access, opening hours, room use and any areas that should not be entered.",
      },
      {
        question: "What types of educational spaces can Mundoria clean?",
        answer:
          "Mundoria can support suitable spaces such as classrooms, staff rooms, offices, toilets, corridors, reception areas and other agreed communal areas.\n\nThe exact scope depends on the site.\n\nA small nursery or training centre may need something very different from a larger school or college building, so we would not treat every educational facility as the same kind of job.\n\nThe booking should be built around the actual premises and the areas that need attention.",
      },
      {
        question: "Can Mundoria clean classrooms?",
        answer:
          "Yes.\n\nClassrooms can be included in the cleaning schedule.\n\nThat may cover floors, accessible surfaces, desks, tables, doors and other agreed areas.\n\nIf there is teaching equipment, student work, personal belongings or anything that should not be moved, that should be made clear before the clean.\n\nThe cleaner should know where cleaning ends and where the contents of the classroom need to be left alone.",
      },
      {
        question: "Can Mundoria clean staff rooms?",
        answer:
          "Yes.\n\nStaff rooms, offices and other employee areas can be included as part of the booking.\n\nThat may include floors, accessible surfaces, kitchen or break areas and other agreed spaces.\n\nIf there are personal belongings, confidential documents or staff-only areas with specific rules, those details should be provided in advance.",
      },
      {
        question: "Can Mundoria clean toilets and communal areas?",
        answer:
          "Yes.\n\nToilets, washrooms, corridors, entrances and other shared areas can be included.\n\nThese spaces often need more frequent attention because they are used by many people throughout the day.\n\nThe cleaning schedule should reflect actual use rather than assuming every room needs the same frequency.\n\nA quiet office may need less attention than a busy corridor or washroom.",
      },
      {
        question: "Can cleaning take place outside teaching hours?",
        answer:
          "Yes, where access and professional availability allow.\n\nCleaning before classes begin, after teaching finishes or during quieter periods can help reduce disruption to students and staff.\n\nIf the site has alarms, security procedures, locked areas or specific entry requirements, those need to be explained clearly before the booking.\n\nThe cleaner should be able to arrive, work and leave safely without having to work out the building's procedures on the day.",
      },
      {
        question: "Can cleaning be scheduled during holidays?",
        answer:
          "Yes.\n\nSchool holidays or other closure periods can be a useful time for more detailed cleaning because the building may be quieter and easier to access.\n\nYou can arrange routine cleaning, a deeper clean or attention to particular areas during those periods, depending on what the site needs.\n\nIf the building has restricted holiday access or different security arrangements, include that information when booking.",
      },
      {
        question: "Are cleaners DBS checked?",
        answer:
          "Yes.\n\nMundoria includes DBS checks as part of its onboarding process for cleaning professionals.\n\nFor educational settings, this is especially important because cleaners may be working in environments used by children, young people or other potentially vulnerable groups.\n\nThe exact suitability requirements for a particular site may depend on the setting and the circumstances of the work, so any site-specific safeguarding requirements should be made clear before the booking.",
      },
      {
        question: "Does Mundoria offer specialist infection-control cleaning?",
        answer:
          "Not currently.\n\nMundoria can provide normal educational facility cleaning, including appropriate routine cleaning of shared and high-touch areas.\n\nWe do not currently offer specialist clinical decontamination, outbreak-response cleaning or other services that require specialist infection-control procedures, chemicals, equipment or certification.\n\nIf a site needs that kind of work, a specialist provider would be more appropriate.",
      },
      {
        question: "How is educational facility cleaning priced?",
        answer:
          "Pricing depends on the size of the premises, the number of rooms and shared areas, the level of use, how often cleaning is required and whether products or equipment are being supplied.\n\nA small training centre with a few rooms is a very different job from a larger school with several classrooms, toilets, corridors and staff areas.\n\nFor that reason, Mundoria looks at the expected cleaner-hours and the actual scope of the site rather than applying one flat price to every educational facility.\n\nRegular educational cleaning starts from the relevant commercial rate, while deeper cleaning is priced higher because it usually needs more time and more detailed work.\n\nThe aim is to make the price reflect the real work involved.",
      },
    ],
  },
  {
    id: "communal",
    title: "Communal Area Cleaning",
    description: "Shared spaces in blocks, halls and developments.",
    items: [
      {
        question: "Does Mundoria clean communal areas?",
        answer:
          "Yes.\n\nMundoria can provide cleaning for shared residential and managed spaces where the work falls within our normal commercial cleaning scope.\n\nThat can include entrances, hallways, staircases, lifts, shared floors and other agreed communal areas.\n\nBecause these spaces are used by different people throughout the day, the cleaning should be built around the way the building is actually used rather than treated like a private home.",
      },
      {
        question: "What types of communal areas can Mundoria clean?",
        answer:
          "Mundoria can clean suitable shared spaces such as apartment-block entrances, hallways, staircases, lifts, shared landings, reception-style areas and other agreed common spaces.\n\nThe exact scope depends on the building.\n\nA small block with one entrance and a short hallway will need something very different from a larger development with several floors, lifts and multiple shared areas.\n\nThat is why the booking should reflect the actual layout and level of use.",
      },
      {
        question: "Can Mundoria clean apartment-block entrances?",
        answer:
          "Yes.\n\nEntrances are often one of the most heavily used areas in a residential building, so they can be included as a priority part of the cleaning schedule.\n\nThat may include floors, accessible surfaces, doors, glass panels, mats and other agreed areas.\n\nIf the entrance is affected by heavy footfall, rain, mud or seasonal dirt, it may need more frequent attention than quieter parts of the building.",
      },
      {
        question: "Can Mundoria clean hallways?",
        answer:
          "Yes.\n\nShared hallways and landings can be included in regular communal-area cleaning.\n\nThat may involve vacuuming, sweeping, mopping, dusting accessible surfaces and cleaning other agreed areas.\n\nIf there are personal belongings, stored items or anything that should not be moved, that should be made clear before the clean.",
      },
      {
        question: "Can Mundoria clean staircases?",
        answer:
          "Yes.\n\nStaircases can be included as part of the communal cleaning routine.\n\nThat may include steps, landings, accessible handrails and surrounding areas.\n\nBecause staircases are high-traffic areas, they often need regular attention to keep them looking and feeling well maintained.\n\nThe cleaner should also be able to work safely without creating unnecessary risk for residents using the stairs.",
      },
      {
        question: "Can Mundoria clean lifts?",
        answer:
          "Yes.\n\nLifts can be included where suitable.\n\nThat may include floors, mirrors, doors, accessible panels and other agreed surfaces.\n\nIf the building has specific rules around lift cleaning, maintenance access or products that can be used on particular finishes, those details should be provided before the booking.",
      },
      {
        question: "Can Mundoria clean shared floors?",
        answer:
          "Yes.\n\nShared floors can be vacuumed, swept or mopped depending on the surface and what has been agreed.\n\nIf there are different flooring types across the building, the cleaner should use suitable methods for each one.\n\nMundoria does not currently provide specialist floor restoration, polishing or other machine-based specialist treatments.",
      },
      {
        question: "Can property managers arrange recurring communal cleaning?",
        answer:
          "Yes.\n\nProperty managers can arrange recurring cleaning for suitable managed buildings.\n\nThat might mean weekly, several times a week or another schedule depending on the size of the property and how heavily the shared areas are used.\n\nFor ongoing work, the routine can be reviewed if the needs of the building change over time.",
      },
      {
        question: "Can landlords book communal-area cleaning?",
        answer:
          "Yes.\n\nLandlords can arrange cleaning for shared areas in properties they manage, provided they have authority to do so and suitable access can be arranged.\n\nThe booking should clearly identify the areas to be cleaned and any building-specific instructions the professional needs to know.",
      },
      {
        question: "Can housing developments book regular cleaning?",
        answer:
          "Yes.\n\nMundoria can support suitable residential developments with recurring communal-area cleaning.\n\nLarger developments may need a more detailed schedule because different areas can have very different levels of use.\n\nAn entrance used by hundreds of residents will not need the same routine as a quieter upper-floor landing.\n\nThe cleaning plan should reflect that rather than treating the whole development as one identical space.",
      },
      {
        question: "How often should communal areas be cleaned?",
        answer:
          "It depends on how busy the building is.\n\nA smaller block with light footfall may only need cleaning once a week.\n\nA busier development with several residents, frequent visitors, lifts and heavily used entrances may need cleaning several times a week or even more often in certain areas.\n\nThe right frequency depends on footfall, weather exposure, building size and the standard the property manager or residents want to maintain.\n\nThe aim is to clean often enough that shared spaces stay under control, not simply follow a fixed schedule because that is what every other building does.",
      },
      {
        question: "How is communal-area cleaning priced?",
        answer:
          "Pricing depends on the size of the building, the number of shared areas, the amount of cleaning time required, how often the service is needed and whether products or equipment are being supplied.\n\nA small apartment block with one entrance and one staircase is a very different job from a larger residential development with several floors, lifts and multiple shared areas.\n\nFor that reason, Mundoria looks at the expected cleaner-hours and the actual scope of the building rather than applying one flat price to every property.\n\nRegular communal-area cleaning starts from the relevant commercial rate, while deeper or more detailed cleaning is priced higher because it usually requires more time and attention.",
      },
    ],
  },
  {
    id: "short-let",
    title: "Short-Let & Holiday Rental Cleaning",
    description: "Airbnb, holiday lets and guest turnovers.",
    items: [
      {
        question: "Does Mundoria clean short-let properties?",
        answer:
          "Yes.\n\nMundoria can provide cleaning for short-let properties between stays or as part of an ongoing cleaning schedule.\n\nThat might be a city-centre apartment, a serviced flat, a holiday property or another furnished property used for short stays.\n\nShort-let cleaning is slightly different from ordinary home cleaning because the timing matters more. The property often needs to be ready for the next guest within a specific window, so the booking needs to reflect check-out times, check-in times, access arrangements and the actual condition of the property.",
      },
      {
        question: "Does Mundoria clean holiday rentals?",
        answer:
          "Yes.\n\nHoliday rentals can be cleaned between guest stays, before a new booking starts or as part of a recurring schedule.\n\nThe clean can focus on the areas guests use most, such as bedrooms, bathrooms, kitchens, living spaces, floors and other agreed areas.\n\nBecause holiday properties can vary a lot in size and layout, the booking should be based on the actual property rather than a one-size-fits-all checklist.",
      },
      {
        question: "Does Mundoria clean Airbnb properties?",
        answer:
          "Yes.\n\nMundoria can clean properties used for Airbnb and other short-let platforms.\n\nThe service is designed around the practical needs of a guest turnover: one stay ends, the property needs to be cleaned properly, and the next guest may be arriving soon after.\n\nYou do not need to manage the property through Airbnb specifically. If it is used for short stays, the same cleaning approach can apply.",
      },
      {
        question: "What is included in short-let cleaning?",
        answer:
          "Short-let cleaning can include the areas needed to get the property ready for the next guest.\n\nThat may include bedrooms, bathrooms, kitchens, living areas, floors, accessible surfaces, bins and other agreed areas.\n\nThe exact scope depends on the property and what you want included in the turnover.\n\nIf you also want tasks such as bed making, linen handling, restocking or reporting issues, those need to be clearly agreed as part of the service rather than assumed automatically.",
      },
      {
        question: "Can Mundoria clean between guest stays?",
        answer:
          "Yes.\n\nThat is one of the main reasons people use short-let cleaning.\n\nYou can arrange the clean after one guest checks out and before the next guest arrives, as long as there is enough time available for the work to be completed properly.\n\nIf the turnover window is very short, it is especially important that the booking reflects the size of the property and the amount of work likely to be needed.\n\nWe would rather be realistic about the time than create a situation where the cleaner is expected to rush through the property before the next guest arrives.",
      },
      {
        question: "Can I schedule recurring short-let cleans?",
        answer:
          "Yes.\n\nIf you manage a property with regular bookings, recurring short-let cleaning can be arranged around the expected guest schedule where suitable availability exists.\n\nThat can make repeated turnovers easier to manage because the property details, access information and cleaning requirements do not need to be rebuilt from scratch every time.\n\nIf the guest schedule changes, the cleaning schedule may need to change with it.",
      },
      {
        question: "Can cleaning be arranged around check-in and check-out times?",
        answer:
          "Yes, where the timing is practical and suitable professionals are available.\n\nTell us the guest check-out time, the next check-in time and when the cleaner can actually enter the property.\n\nThat allows the booking to be planned around the real turnover window.\n\nIf the gap is too short for the amount of cleaning required, it is better to know that before the booking rather than discover it on the day.",
      },
      {
        question: "Can Mundoria clean multiple short-let properties?",
        answer:
          "Yes.\n\nHosts and property managers with more than one short-let property can arrange cleaning across multiple locations.\n\nEach property should still have its own accurate booking information because the size, layout, access and cleaning requirements may be different.\n\nIf several properties need cleaning on the same day, timing and professional availability become especially important.",
      },
      {
        question: "Can property managers use Mundoria?",
        answer:
          "Yes.\n\nProperty managers can use Mundoria to arrange cleaning for suitable short-let and holiday-rental properties.\n\nYou can provide the property details, access instructions, turnover times and any agreed priorities for each booking.\n\nFor recurring properties, keeping those details accurate can make future cleans much easier to arrange.",
      },
      {
        question: "Can Mundoria restock guest supplies?",
        answer:
          "Only where this has been specifically agreed as part of the service.\n\nIf you want items such as toilet paper, hand soap or other guest essentials restocked, the products need to be available at the property or another agreed arrangement needs to be in place.\n\nRestocking should not be assumed to be part of every short-let clean.\n\nIf Mundoria formally adds a dedicated restocking option, it should appear clearly in the booking journey so hosts know exactly what is included.",
      },
      {
        question: "Does Mundoria provide linen services?",
        answer:
          "Not currently as a standalone linen-hire service.\n\nIf clean linen is already available at the property, certain linen-related tasks may be agreed as part of the turnover.\n\nMundoria should not promise linen supply, collection or exchange unless that service has been formally added to the platform.",
      },
      {
        question: "Does Mundoria provide laundry services?",
        answer:
          "Not currently as a standard short-let cleaning service.\n\nLaundry takes additional time and depends heavily on whether suitable washing and drying facilities are available.\n\nIf Mundoria introduces a dedicated laundry option in future, it should be priced and shown separately rather than quietly included inside the cleaning time.\n\nFor now, hosts should not assume laundry is included.",
      },
      {
        question: "Can Mundoria make beds?",
        answer:
          "Yes, where bed making has been included in the agreed booking and clean linen is available.\n\nFor short-let properties, preparing beds can be an important part of getting the property ready for the next guest.\n\nThe linen should be clearly organised and ready to use so the cleaner is not spending turnover time trying to work out which set belongs to which bed.\n\nIf bed making is important for your property, include it in the booking.",
      },
      {
        question: "Can Mundoria report damage or missing items?",
        answer:
          "A cleaning professional can flag obvious issues they notice while working, but the clean should not be treated as a full property inspection or inventory service unless Mundoria formally offers one.\n\nIf something looks damaged, broken or noticeably out of place, that can be reported through the appropriate process.\n\nHowever, the professional cannot reasonably be expected to know the full inventory of every property or determine whether every missing item was present before the previous guest arrived.\n\nIf you need a formal inspection or inventory check between stays, that should be treated as a separate service.",
      },
      {
        question: "How is short-let cleaning priced?",
        answer:
          "Pricing depends on the size of the property, the number of rooms, the amount of cleaning time required and any additional agreed turnover tasks.\n\nA studio apartment with one bathroom is very different from a three-bedroom short-let with multiple beds, bathrooms and a tight guest-changeover window.\n\nFor that reason, Mundoria looks at the expected cleaner-hours and the actual scope of the turnover rather than assuming every short-let property should cost the same.\n\nIf additional tasks such as bed making or restocking are included, those should be clearly reflected in the booking and price before confirmation.",
      },
    ],
  },
  {
    id: "recovery",
    title: "Recovery Cleaning",
    description: "Pregnancy, illness, hospital discharge and bereavement support cleans.",
    items: [
      {
        question: "What is Mundoria Recovery?",
        answer:
          "Mundoria Recovery is home cleaning for times when everyday life has changed and keeping on top of the house may be harder than usual.\n\nThat might be during pregnancy, after having a baby, while recovering from an illness or injury, around a return home from hospital, or during bereavement.\n\nThe service is still cleaning.\n\nWhat changes is the way the booking is approached.\n\nThere may be more sensitivity around timing, access, mobility, noise, products, particular rooms or who is making the booking.\n\nThe aim is to take one practical job off the list at a time when there may already be enough to deal with.",
      },
      {
        question: "Who is Mundoria Recovery for?",
        answer:
          "It is for people and households who need cleaning around a particular life situation rather than just a normal weekly routine.\n\nThat could be someone who is pregnant, a household adjusting to a new baby, somebody recovering from illness or injury, someone returning home from hospital, or a family dealing with bereavement.\n\nIt can also be booked by a relative, partner or another person arranging practical support on someone else's behalf.\n\nYou do not need to prove that you \"need help enough\".\n\nIf cleaning has become harder to manage and you want it taken care of, that is reason enough.",
      },
      {
        question: "Is Mundoria Recovery a care service?",
        answer:
          "No.\n\nMundoria Recovery is a cleaning service.\n\nWe do not provide personal care, help with washing or dressing, mobility assistance, feeding, medication support or other regulated care activities.\n\nThe service is designed to look after the home environment, not the person.",
      },
      {
        question: "Is Mundoria Recovery a medical service?",
        answer:
          "No.\n\nMundoria does not provide medical treatment, medical advice or healthcare services.\n\nRecovery Cleaning is there to help with the practical cleaning around the home while someone is going through a period of recovery or change.\n\nAnything medical should remain with the person's healthcare professionals.",
      },
      {
        question: "Is Mundoria Recovery a nursing service?",
        answer:
          "No.\n\nMundoria is not a nursing provider.\n\nCleaning professionals do not provide clinical care, nursing procedures, wound care, medication administration or health monitoring.\n\nTheir role is to carry out the agreed cleaning.\n\nNothing more should be expected of them simply because the booking sits within Recovery.",
      },
      {
        question: "What is Pregnancy & Postpartum Home Cleaning?",
        answer:
          "Pregnancy & Postpartum Home Cleaning is cleaning arranged around pregnancy, preparing for a baby and the period after birth.\n\nThat may mean taking care of regular household cleaning when bending, lifting or keeping up with the home has become more difficult.\n\nIt may also mean preparing key parts of the home before the baby arrives or keeping things under control during the early weeks afterwards.\n\nThe clean can be shaped around the household's priorities, such as bedrooms, bathrooms, kitchens, floors and living areas.\n\nThe aim is not to create a perfect home.\n\nIt is to reduce one source of pressure during a period when life may already feel very full.",
      },
      {
        question: "What is Illness & Injury Recovery Home Cleaning?",
        answer:
          "This service is for people whose normal ability to clean has been affected by illness or injury.\n\nThat might be because someone needs to rest, has reduced mobility for a period of time or simply does not have the energy to keep up with normal household tasks.\n\nCleaning can be focused on the areas that matter most, such as the kitchen, bathroom, bedroom, floors or shared living spaces.\n\nMundoria does not provide rehabilitation, physiotherapy, personal care or medical support.\n\nWe take care of the cleaning while recovery takes its own course.",
      },
      {
        question: "What is Hospital Discharge Home Cleaning?",
        answer:
          "Hospital Discharge Home Cleaning is for preparing or maintaining a home around someone's return from hospital.\n\nA booking can be arranged before the person comes home, so important areas are cleaned and ready for their return, or after they are already back.\n\nThat might include bedrooms, bathrooms, kitchens, floors and other areas they will be using.\n\nIt is not a clinical discharge service and it does not replace any instructions from the hospital or healthcare team.\n\nIt simply means the home cleaning does not have to become another thing for the person or family to manage.",
      },
      {
        question: "What is Bereavement Home Cleaning?",
        answer:
          "Bereavement Home Cleaning is practical home cleaning for people and families dealing with a loss.\n\nSometimes the house still needs looking after when nobody has the headspace or energy for it.\n\nThe service can be used for normal household cleaning, a deeper clean or particular areas that have become difficult to manage during that time.\n\nThe approach should be quiet, respectful and straightforward.\n\nWe are there to clean the home.\n\nWe do not provide bereavement counselling, emotional therapy or specialist trauma cleaning.",
      },
      {
        question: "Can someone else book recovery cleaning for me?",
        answer:
          "Yes.\n\nA partner, relative, friend or another authorised person can arrange the booking on your behalf.\n\nThey will need to provide accurate information about the property, access and anything important to the cleaning.\n\nWhere appropriate, the person receiving the service should know about the booking and be comfortable with the arrangement.\n\nThe aim is for the clean to work around the person in the home, even if somebody else organised it.",
      },
      {
        question: "Can a family member arrange cleaning on my behalf?",
        answer:
          "Yes.\n\nThis is particularly common when someone is recovering, returning home from hospital or simply has too much going on to organise the booking themselves.\n\nThe family member can provide the booking details, arrange access and explain any preferences that need to be considered.\n\nIf there are areas that should not be entered, mobility considerations or product sensitivities, those details should be included before the clean.",
      },
      {
        question: "Can recovery cleaning be arranged before I return home?",
        answer:
          "Yes.\n\nThat can be especially useful after a hospital stay or during another period away from home.\n\nIf suitable access can be arranged, the cleaner can attend before you return and focus on the agreed areas.\n\nYou may want the bedroom, bathroom, kitchen and main living spaces prioritised so the home feels easier to come back to.\n\nThe person making the booking should make sure access and any important instructions are clear beforehand.",
      },
      {
        question: "Can recovery cleaning be booked after I return home?",
        answer:
          "Yes.\n\nYou do not have to arrange everything before returning.\n\nOnce you are home, a clean can still be booked around the areas that would make the biggest difference to you.\n\nIf you need certain rooms kept quiet, want the cleaner to avoid where you are resting or have limited movement around the property, tell us.\n\nThe booking should work around the household, not the other way around.",
      },
      {
        question: "Can I choose which rooms are prioritised?",
        answer:
          "Yes.\n\nYou may not need the whole home cleaned at the same level.\n\nDuring recovery, the most useful areas may be the bedroom, bathroom, kitchen and the rooms being used most often.\n\nDuring pregnancy or after having a baby, priorities may be different again.\n\nTell us what matters most.\n\nThe cleaner can then use the booked time where it will be most useful to you.",
      },
      {
        question: "Can Mundoria work around mobility considerations?",
        answer:
          "Yes, where the cleaning can be carried out safely.\n\nIf someone has reduced mobility, uses mobility equipment or needs certain pathways kept clear, include that information in the booking.\n\nThat helps the cleaner understand how to move around the home without causing unnecessary disruption.\n\nWe can adapt the cleaning approach around the household, but cleaning professionals do not provide physical assistance or mobility support to the person.",
      },
      {
        question: "Can Mundoria work around a new baby?",
        answer:
          "Yes.\n\nIf there is a new baby in the home, tell us so the booking can take that into account.\n\nThat may mean working around sleeping times, avoiding particular rooms at certain times, keeping noise down where practical or following product preferences.\n\nEvery household settles into life with a new baby differently.\n\nThe cleaning should fit around that rather than expecting the household to fit around the cleaning.",
      },
      {
        question: "Can Mundoria use fragrance-free products?",
        answer:
          "Where suitable fragrance-free products are available for the agreed cleaning tasks, yes.\n\nIf fragrance sensitivity matters to you, make that clear before the booking.\n\nYou can also choose to provide products you already know work for you.\n\nThe important thing is not to assume that every standard cleaning product will suit every household.",
      },
      {
        question: "Can Mundoria avoid certain cleaning products?",
        answer:
          "Yes, where the clean can still be carried out effectively and safely.\n\nIf there are products, ingredients or fragrances you do not want used, tell us before the booking.\n\nThat may be because of allergies, sensitivities, pregnancy, pets or simply personal preference.\n\nIf avoiding a product changes what can realistically be cleaned, we should be clear about that rather than substitute something without telling you.",
      },
      {
        question: "Can Mundoria provide medical-grade cleaning?",
        answer:
          "No.\n\nMundoria does not currently provide medical-grade cleaning or specialist healthcare-environment cleaning.\n\nRecovery Cleaning is domestic cleaning designed around a person's circumstances.\n\nIt should not be confused with clinical decontamination, hospital cleaning or any service requiring specialist healthcare protocols.",
      },
      {
        question: "Can Mundoria provide clinical cleaning?",
        answer:
          "No.\n\nClinical cleaning requires specialist procedures, training and controls that sit outside Mundoria's current service.\n\nIf a property requires clinical decontamination or specialist cleaning because of a medical or contamination risk, a specialist provider should be used.",
      },
      {
        question: "Can Mundoria provide personal care?",
        answer:
          "No.\n\nMundoria cleaning professionals do not help with bathing, dressing, toileting, feeding, transfers or other personal-care activities.\n\nIf someone needs those kinds of services, they should be arranged through an appropriate care provider.\n\nMundoria's role remains focused on the home and the cleaning.",
      },
      {
        question: "Can Mundoria help with medication?",
        answer:
          "No.\n\nMundoria cleaning professionals do not administer, organise or remind people about medication.\n\nMedication should be handled by the individual, their family where appropriate, or the relevant healthcare or care professionals.\n\nIf medication is present in the home during a clean, it should be stored securely and kept away from the areas being cleaned.",
      },
      {
        question: "Does Mundoria provide bereavement counselling?",
        answer:
          "No.\n\nBereavement Home Cleaning is practical cleaning support only.\n\nWe do not provide counselling, therapy or emotional-support services.\n\nOur role is simply to take care of the cleaning respectfully at a time when the household may not want another practical task to deal with.",
      },
      {
        question: "Can recovery cleaning become regular home cleaning later?",
        answer:
          "Yes.\n\nRecovery cleaning does not have to remain a separate arrangement forever.\n\nSomeone may begin with cleaning during pregnancy, after hospital discharge or while recovering from an injury and later decide that regular weekly or fortnightly cleaning would still make life easier.\n\nWhen circumstances change, the service can change too.\n\nThere is no need to keep using a Recovery service once ordinary Regular Home Cleaning becomes the better fit.",
      },
    ],
  },
  {
    id: "products",
    title: "Products & Equipment",
    description: "Supplies, fragrance-free options and add-ons.",
    items: [
      {
        question: "Do I need to provide cleaning products?",
        answer:
          "No, not necessarily.\n\nYou can provide suitable cleaning products at the property, or you can choose to have Mundoria supply them where that option is available.\n\nSome people prefer to use products they already know and like. Others would rather not think about it at all.\n\nEither is fine.\n\nThe important thing is that the products available are suitable for the surfaces being cleaned and that any preferences or restrictions are made clear before the booking.",
      },
      {
        question: "Do I need to provide cleaning equipment?",
        answer:
          "Not necessarily.\n\nYou can provide suitable equipment such as a vacuum cleaner, mop and bucket, or choose the Mundoria equipment-supply option where available.\n\nIf you are providing your own equipment, it should be safe, clean and in good working order.\n\nA cleaner should not have to spend part of the booking trying to fix a broken vacuum or work around equipment that is not suitable for the job.",
      },
      {
        question: "Can Mundoria supply cleaning products?",
        answer:
          "Yes.\n\nMundoria can supply the cleaning products needed for eligible bookings where you choose that option.\n\nThat can be useful if you do not keep a full cleaning kit at home, have just moved into a property or simply prefer not to think about which products are needed.\n\nThe relevant charge should be shown clearly before the booking is confirmed.",
      },
      {
        question: "Can Mundoria supply cleaning equipment?",
        answer:
          "Yes.\n\nMundoria can provide standard cleaning equipment for eligible bookings where that option is selected.\n\nThat may include things like a suitable vacuum cleaner, mop, bucket, cloths, brushes and other standard equipment needed for the agreed clean.\n\nSpecialist machinery is not part of Mundoria's current service.",
      },
      {
        question: "How much does product supply cost?",
        answer:
          "For Regular Home Cleaning, Mundoria currently charges an additional £2 per hour where cleaning products are supplied.\n\nDifferent services may need different products, so the charge can vary depending on the type of clean.\n\nFor example, deeper cleaning normally requires a wider range of products than a regular maintenance clean.\n\nThe price shown during booking should reflect the service you have selected.",
      },
      {
        question: "How much does equipment supply cost?",
        answer:
          "For Regular Home Cleaning, Mundoria currently charges an additional £3 per hour where equipment is supplied.\n\nThe charge can vary for other services because a deep clean or commercial clean may need a broader range of standard equipment.\n\nIf you choose to have Mundoria supply both products and equipment, both charges should be shown clearly before you confirm the booking.",
      },
      {
        question: "What cleaning products does Mundoria normally use?",
        answer:
          "The exact products depend on the type of clean and the surfaces in the property.\n\nFor regular home cleaning, that may include suitable multi-surface cleaner, bathroom and toilet cleaner, glass and mirror cleaner, kitchen degreaser, floor cleaner, limescale remover, disinfectant, washing-up liquid, white vinegar, bicarbonate of soda and scouring cream.\n\nNot every product is used on every surface.\n\nFor example, some products that work well on one material may damage another.\n\nThe cleaner should use products appropriately rather than treating every surface in the home the same way.",
      },
      {
        question: "What equipment does a cleaner normally need?",
        answer:
          "For a typical home clean, standard equipment may include a vacuum cleaner, mop, bucket, microfibre cloths, sponges, dusting tools, a squeegee and other basic cleaning tools.\n\nA deep clean may need additional detail brushes, scrubbing tools or other standard equipment.\n\nCommercial bookings can also require things like colour-coded cloths and wet-floor warning signs.\n\nThe exact kit depends on the service being carried out.",
      },
      {
        question: "Can I ask the cleaner to use my own products?",
        answer:
          "Yes.\n\nIf there are products you already use and would prefer the cleaner to use, you can provide them.\n\nIt helps to make this clear in the booking so the professional knows what will be available at the property.\n\nIf a product should only be used on a particular surface, say so.\n\nYour preferences matter, but the cleaner should still be able to avoid using something in a way that could damage the property.",
      },
      {
        question: "Can I request fragrance-free products?",
        answer:
          "Yes, where suitable fragrance-free products are available for the agreed cleaning tasks.\n\nIf fragrance sensitivity matters to you, add that information before the booking.\n\nYou can also choose to provide products you already know work well for your household.\n\nWe would rather know about a preference in advance than have you uncomfortable with a product after it has already been used.",
      },
      {
        question: "What if I have allergies or chemical sensitivities?",
        answer:
          "Tell us before the clean.\n\nIf certain ingredients, fragrances or cleaning products cause a reaction, include that information in the booking.\n\nYou may prefer to provide your own products, or we can work around the restriction where suitable alternatives are available.\n\nIf avoiding a particular product means a certain task cannot be completed safely or effectively, we should be clear about that rather than quietly use something else.",
      },
      {
        question: "Can I ask the cleaner not to use a particular product?",
        answer:
          "Yes.\n\nIf there is something you do not want used in your home or workplace, tell us.\n\nThat could be because of allergies, pets, children, a delicate surface or simply personal preference.\n\nThe cleaner should not need to guess.\n\nClear instructions make the booking easier for everyone.",
      },
      {
        question: "Are products included in the hourly rate?",
        answer:
          "Not automatically.\n\nFor services where products can be supplied by Mundoria, the product charge is added separately if you choose that option.\n\nIf you provide suitable products yourself, you do not pay the product-supply charge.\n\nThis keeps the pricing clearer because you can see what you are paying for rather than having everything hidden inside one rate.",
      },
      {
        question: "Is equipment included in the hourly rate?",
        answer:
          "Not automatically.\n\nIf you need Mundoria to supply standard equipment, the relevant equipment charge is added to the booking.\n\nIf suitable equipment is already available at the property, you can choose to provide it yourself.\n\nThe booking should make that choice and the related cost clear before confirmation.",
      },
      {
        question: "Are deep-cleaning products different from regular-cleaning products?",
        answer:
          "Often, yes.\n\nRegular cleaning is mainly about maintaining a home that is already in reasonable condition, so the product kit is usually focused on everyday cleaning.\n\nDeep cleaning may require stronger degreasers, more detailed bathroom products, limescale treatment, scouring cream and other products suited to heavier build-up.\n\nThat does not mean \"stronger\" is automatically better.\n\nThe right product still depends on the surface being cleaned.\n\nThe goal is to use what is appropriate, not simply the harshest product available.",
      },
      {
        question:
          "Are commercial-cleaning products different from home-cleaning products?",
        answer:
          "They can be.\n\nCommercial spaces may have different floor types, larger shared areas, busier washrooms and higher footfall than a typical home.\n\nThat can affect the products and equipment needed.\n\nFor example, commercial cleaning may involve more frequent disinfecting of shared touchpoints, larger floor areas and colour-coded cleaning materials to help keep different areas separate.\n\nThe products used should still be appropriate for the site and the agreed cleaning scope.",
      },
      {
        question: "Does Mundoria provide specialist equipment?",
        answer:
          "Not currently.\n\nMundoria supplies standard cleaning equipment for the services we currently offer.\n\nWe do not currently provide specialist machinery such as carpet extraction machines, industrial floor-restoration equipment, steam systems for specialist treatment or other equipment used for specialist cleaning.\n\nIf a job needs specialist machinery, it falls outside Mundoria's current service scope.",
      },
      {
        question: "Can cleaners use my vacuum cleaner?",
        answer:
          "Yes, if it is suitable and in good working order.\n\nIf you would like the cleaner to use your vacuum, make sure it is accessible and has what it needs to work properly.\n\nThat might mean an empty or usable dust container, a working cable or battery, and the relevant attachments where needed.\n\nIf the vacuum is damaged or not suitable for the job, it may limit what can be completed.",
      },
      {
        question: "Can cleaners use my mop?",
        answer:
          "Yes.\n\nIf you provide a suitable mop and bucket, the cleaner can use them for the areas where mopping is appropriate.\n\nThe equipment should be clean, functional and suitable for your flooring.\n\nIf a particular floor requires a specific cleaning method or product, include that information before the clean.",
      },
      {
        question: "What happens if the equipment at my property is not suitable?",
        answer:
          "The cleaner will do what they reasonably can with the equipment available, but unsuitable or broken equipment can limit the work.\n\nFor example, if the vacuum has no suction or the mop is unusable, the cleaner may not be able to complete those tasks properly.\n\nWhere possible, the professional should flag the problem rather than pretend everything has been completed normally.\n\nIf you know in advance that your equipment is not suitable, it is better to choose the Mundoria equipment-supply option before the booking.\n\nThat way, the cleaning time can be spent cleaning rather than trying to work around equipment that does not do the job.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "How estimates work and what affects the price.",
    items: [
      {
        question: "How much does Mundoria cost?",
        answer:
          "Mundoria pricing depends on the type of cleaning you choose, how much time the job is expected to need and whether you want products or equipment supplied.\n\nFor home cleaning, our current rates start from:\n\nRegular Home Cleaning: £22 per hour\n\nDeep Cleaning: £26 per hour\n\nOne-Off Cleaning: £22 per hour for a standard clean or £26 per hour for a deeper clean\n\nApartment & Flat Cleaning: £25 per hour\n\nMove-In Cleaning: £26 per hour\n\nMove-Out Cleaning: £26 per hour\n\nEnd of Tenancy Cleaning: £26 per hour\n\nRecovery Cleaning currently starts from £23 per hour for standard cleaning and £27 per hour for deeper cleaning.\n\nCommercial services are priced separately because workplaces vary much more in size, layout and cleaning requirements. Regular Office Cleaning currently starts from £25 per cleaner-hour, while Office Deep Cleaning starts from £30 per cleaner-hour.\n\nAny additional cost for products or equipment should be shown before you confirm the booking.\n\nThe idea is simple: you should be able to understand where the price comes from.",
      },
      {
        question: "How does Mundoria calculate prices?",
        answer:
          "We start with the type of cleaning you need and the amount of cleaning time the property is likely to require.\n\nThe size of the space matters, but it is not the only thing we consider.\n\nThe number of bathrooms, kitchens, bedrooms or work areas can make a difference. So can the condition of the property, the level of cleaning required and any particular priorities you have given us.\n\nIf you choose to have Mundoria supply products or equipment, those costs are then added separately where applicable.\n\nFor larger commercial properties, we may look at the total number of cleaner-hours needed rather than simply treating the site as one long appointment.\n\nThe price should reflect the work involved, not just the postcode or the number of bedrooms.",
      },
      {
        question: "Why does Mundoria charge by time?",
        answer:
          "Because two homes with the same number of bedrooms can still be completely different cleaning jobs.\n\nOne might be regularly maintained and need a straightforward two-hour clean.\n\nAnother may have several bathrooms, pets, children and areas that need more attention.\n\nCharging around the expected cleaning time gives us a clearer way to reflect that difference.\n\nIt also means you can understand what you are paying for.\n\nRather than hiding the cost inside a vague package, the booking is connected to the amount of cleaning work expected.",
      },
      {
        question: "Will I know the price before I book?",
        answer:
          "Yes.\n\nYou should be able to see the basis of your price before confirming the booking.\n\nThat includes the cleaning rate, the expected time and any additional charges for products or equipment where you have selected them.\n\nIf something about the booking needs to be assessed before an accurate price can be given, we should tell you that rather than show a figure we do not believe is realistic.\n\nNo one likes reaching the final step and discovering that the price has suddenly changed.",
      },
      {
        question: "How do you estimate how long my clean will take?",
        answer:
          "We use the information you provide about the property and the service you have chosen.\n\nThat can include the number of bedrooms and bathrooms, the size of the property, the type of cleaning, the condition of the space and the areas you want prioritised.\n\nFor commercial bookings, we may also consider things like the number of offices, meeting rooms, toilets, kitchens, communal areas and overall floor space.\n\nThe estimate is there to give the cleaner enough time to do the job properly.\n\nIt should not be a race against the clock.",
      },
      {
        question: "What happens if my clean takes longer than estimated?",
        answer:
          "If it becomes clear that the property needs more time than originally expected, the professional should not simply continue indefinitely and leave you with a surprise charge.\n\nWhere additional time is available, the booking can be reviewed and any extra cost should be made clear before more time is added.\n\nIf additional time is not available, the cleaner can focus on the areas you have prioritised within the time already booked.\n\nAccurate property information at the beginning helps reduce the chance of this happening.",
      },
      {
        question: "What happens if my clean takes less time than estimated?",
        answer:
          "You are charged for the cleaning time booked and shown when you confirmed, not for how long the cleaner happened to take on the day.\n\nIf the work is finished sooner than expected, that does not automatically reduce the price. The booking was priced on the estimated time needed for the property and service you selected.\n\nIf you regularly find that less time is needed, you can reduce the hours on future bookings so the estimate better matches the home.",
      },
      {
        question: "Do larger homes cost more?",
        answer:
          "Often, yes, but not simply because they are larger.\n\nA bigger home normally has more floors, rooms and surfaces to clean, which usually means more time is needed.\n\nBut condition matters too.\n\nA large, regularly maintained home may sometimes need less cleaning time than a much smaller property that requires significant attention.\n\nThat is why Mundoria estimates the work rather than using property size alone to decide the price.",
      },
      {
        question: "Do deep cleans cost more than regular cleans?",
        answer:
          "Yes.\n\nDeep cleaning costs more because it involves more detailed work and usually takes longer.\n\nRegular Home Cleaning is currently £22 per hour, while Deep Cleaning is £26 per hour.\n\nFor offices, Regular Office Cleaning currently starts from £25 per cleaner-hour, while Office Deep Cleaning starts from £30 per cleaner-hour.\n\nThe higher rate reflects the additional level of detail and the heavier work that can be involved.",
      },
      {
        question: "Are products charged separately?",
        answer:
          "Yes, where you choose Mundoria to supply them.\n\nFor Regular Home Cleaning, product supply currently adds £2 per hour.\n\nDeep cleaning and commercial bookings can require a broader range of products, so the applicable product charge may be different.\n\nIf you already have suitable products and prefer the cleaner to use them, you can provide your own and avoid the product-supply charge.\n\nThe relevant cost should always be visible before you book.",
      },
      {
        question: "Is equipment charged separately?",
        answer:
          "Yes, where you choose Mundoria to provide it.\n\nFor Regular Home Cleaning, equipment supply currently adds £3 per hour.\n\nDifferent services may need different equipment, particularly deep or commercial cleaning, so the applicable charge can vary.\n\nIf suitable equipment is already available at the property, you can choose to provide it yourself.",
      },
      {
        question: "Are there hidden fees?",
        answer:
          "There should not be.\n\nIf something affects the price of your booking, we want it shown clearly before you confirm.\n\nThat includes the cleaning rate, the estimated time and any selected products or equipment.\n\nIf another charge becomes necessary because the booking itself changes, that should also be explained before you agree to it.\n\nClear pricing is much easier to live with than a cheap-looking price followed by surprises.",
      },
      {
        question: "Does Mundoria charge a booking fee?",
        answer:
          "No.\n\nMundoria does not add a separate booking or platform fee on top of your cleaning price.\n\nWhat you see before you confirm is the cleaning rate for the estimated time, plus any products, equipment or schedule pricing you have selected.",
      },
      {
        question: "Does Mundoria charge extra at weekends?",
        answer:
          "Yes, weekend and off-peak arrival times can cost more than weekday daytime cleaning.\n\nSaturday and Sunday daytime currently carries a weekend arrival rate. Early morning or evening arrivals at the weekend carry a higher weekend peak rate.\n\nWeekday early and evening slots can also have a higher rate than weekday daytime.\n\nAny schedule pricing that applies to your booking is shown before you confirm, so you can see the effect of the day and time you choose.",
      },
      {
        question: "Does Mundoria charge extra on bank holidays?",
        answer:
          "No separate bank-holiday surcharge currently applies.\n\nA bank holiday booking is priced like the equivalent day and time slot shown during booking. If that slot already includes weekend or evening schedule pricing, that is what you will see before you confirm.",
      },
      {
        question: "Is VAT included?",
        answer:
          "The prices shown during booking are the amounts charged for that booking.\n\nMundoria does not currently add a separate VAT line at checkout. If that ever changes, the booking journey will show tax clearly before you confirm.",
      },
      {
        question: "Can I get a quote before booking?",
        answer:
          "Yes.\n\nThe booking journey should give you an expected price based on the information you provide before you commit.\n\nFor straightforward residential bookings, this can usually be calculated from the service, estimated hours and any products or equipment you select.\n\nFor larger or more complex commercial bookings, we may need additional information before giving you a reliable price.\n\nThe aim is to give you something meaningful, not simply call an unrealistic number a \"quote\".",
      },
      {
        question: "Can businesses request a commercial quote?",
        answer:
          "Yes.\n\nBusinesses can provide details about their premises, cleaning requirements, preferred frequency and opening hours so the work can be assessed properly.\n\nFor larger offices, retail spaces, educational facilities or communal buildings, a commercial quote may make more sense than asking the customer to guess how many hours they need.\n\nOnce the scope is understood, Mundoria can estimate the cleaner-hours and expected cost.",
      },
      {
        question: "Why are some commercial prices listed as “from” a certain amount?",
        answer:
          "Because commercial properties vary too much for one hourly figure to describe every job accurately.\n\nA small office with six desks and one toilet is not the same cleaning job as a workplace with several meeting rooms, kitchens, washrooms and dozens of employees.\n\n\"From\" gives you the starting rate for that type of service while allowing the actual booking to reflect the premises and work involved.\n\nIt is not intended to be a vague way of hiding the real price.\n\nThe final cost should still be explained before you confirm the booking.",
      },
      {
        question: "How much is Regular Home Cleaning?",
        answer:
          "Regular Home Cleaning is currently £22 per hour.\n\nIf you would like Mundoria to provide cleaning products, that adds £2 per hour.\n\nIf you would like standard cleaning equipment supplied, that adds £3 per hour.\n\nIf you provide your own suitable products and equipment, those additional supply charges do not apply.\n\nThe final cost depends on how many cleaning hours the home is expected to need.",
      },
      {
        question: "How much is Deep Cleaning?",
        answer:
          "Deep Cleaning is currently £26 per hour.\n\nBecause deep cleaning can require a wider range of products and equipment than regular cleaning, any applicable supply costs should be shown separately when you book.\n\nThe total price depends on how much time the property is expected to need and the areas you want included.",
      },
      {
        question: "How much is One-Off Cleaning?",
        answer:
          "A standard One-Off Clean is currently £22 per hour.\n\nIf you choose a deeper One-Off Clean, the current rate is £26 per hour.\n\nThat means you can choose the level of cleaning that fits the property rather than automatically paying for a deep clean when routine cleaning is all you need.\n\nAny selected products or equipment are charged separately where applicable.",
      },
      {
        question: "How much is Move-In Cleaning?",
        answer:
          "Move-In Cleaning is currently £26 per hour.\n\nThe total cost depends on the property size, condition, areas to be cleaned and the number of hours expected.\n\nAny product or equipment supply selected as part of the booking is added separately where applicable.",
      },
      {
        question: "How much is Move-Out Cleaning?",
        answer:
          "Move-Out Cleaning is currently £26 per hour.\n\nHow much the complete booking costs depends on how large the property is, how much work is required and how many cleaning hours are needed.\n\nThe clearer the property is of furniture and belongings, the easier it is to make good use of the cleaning time.",
      },
      {
        question: "How much is End of Tenancy Cleaning?",
        answer:
          "End of Tenancy Cleaning is currently £26 per hour.\n\nBecause these bookings often involve more detailed work throughout an empty or nearly empty property, they may require more hours than an ordinary home clean.\n\nThe total price is therefore based on the expected amount of cleaning time rather than one fixed price for every tenancy.",
      },
      {
        question: "How much is Office Cleaning?",
        answer:
          "Regular Office Cleaning currently starts from £25 per cleaner-hour.\n\nOffice Deep Cleaning currently starts from £30 per cleaner-hour.\n\nThe actual cost depends on the size of the workplace, the number and type of areas being cleaned, how frequently the service is needed and whether products or equipment are being supplied.\n\nFor larger sites, Mundoria may quote the total expected cleaner-hours rather than expecting you to calculate the job yourself.",
      },
      {
        question: "How much is Recovery Cleaning?",
        answer:
          "Recovery Cleaning currently starts from £23 per hour for standard cleaning and £27 per hour for deeper cleaning.\n\nThat applies across Mundoria Recovery services such as Pregnancy & Postpartum Home Cleaning, Illness & Injury Recovery Home Cleaning, Hospital Discharge Home Cleaning and Bereavement Home Cleaning.\n\nThe slightly different rate reflects the way these bookings are handled around individual circumstances and preferences.\n\nThe service remains cleaning only. There are no medical, nursing or personal-care services included in the price.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description: "Cards, timing, receipts and refunds.",
    items: [
      {
        question: "How do I pay for my booking?",
        answer:
          "Payments are made through Mundoria rather than directly to the cleaning professional.\n\nWhen you book, the payment details connected to that booking are handled through the Mundoria payment journey.\n\nThe aim is to keep the booking and the payment together so you are not being asked to arrange separate transfers, cash payments or private payment methods with the cleaner.",
      },
      {
        question: "Does Mundoria accept card payments?",
        answer:
          "Yes.\n\nMundoria accepts card payments through its payment system.\n\nThe exact card types available should be shown during checkout.\n\nIf additional payment methods are added later, such as Apple Pay or Google Pay, they should appear clearly as part of the payment options rather than being assumed.",
      },
      {
        question: "Are payments processed securely?",
        answer:
          "Yes.\n\nMundoria uses Stripe to process customer payments.\n\nThat means the payment itself is handled through Stripe's payment infrastructure rather than Mundoria manually collecting your card details.\n\nYou should still always make payments through the official Mundoria booking journey rather than sending card information or payment details privately to a cleaning professional.",
      },
      {
        question: "Does Stripe process Mundoria payments?",
        answer:
          "Yes.\n\nStripe is Mundoria's payment processor.\n\nWhen a customer pays through Mundoria, Stripe handles the payment transaction and then settles the relevant funds through Mundoria's payment setup.\n\nFor the customer, the important part is that payment stays connected to the booking rather than being handled privately between you and the cleaner.",
      },
      {
        question: "Do I need to pay the cleaner directly?",
        answer:
          "No.\n\nIf the booking has been arranged through Mundoria, payment should be made through Mundoria.\n\nYou should not normally need to pay the cleaning professional separately.\n\nKeeping payment on the platform makes it easier to keep a clear record of the booking, the amount paid and any issue that may need to be reviewed later.",
      },
      {
        question: "Can I pay cash?",
        answer:
          "No.\n\nMundoria is cashless. Bookings are paid through the Mundoria payment journey using card payment processed by Stripe.\n\nYou should not pay the cleaning professional in cash or by private transfer for a Mundoria booking.",
      },
      {
        question: "When will I be charged?",
        answer:
          "When you book, Mundoria authorises your card for the booking amount. That holds the funds but does not take the final payment yet.\n\nPayment is captured after the clean is completed.\n\nIf the booking is cancelled under the free-cancellation window, the authorisation is released. If a cancellation fee applies, that is handled according to the cancellation terms.",
      },
      {
        question: "Can I get a receipt or invoice?",
        answer:
          "Yes.\n\nCustomers should be able to receive a record of what they have paid for.\n\nThat should include the booking details, amount paid and any applicable product, equipment or other charges.\n\nThe exact format may depend on whether the booking is residential or commercial, but customers should not have to chase for basic proof of payment.",
      },
      {
        question: "Can businesses receive invoices?",
        answer:
          "Yes.\n\nBusinesses using Mundoria should be able to receive invoices or appropriate payment records for their bookings.\n\nWhere required, the invoice can include the relevant business details associated with the booking.\n\nFor recurring commercial cleaning, it is especially important that billing remains clear and easy to reconcile.",
      },
      {
        question: "What happens if my payment fails?",
        answer:
          "If a payment cannot be completed, the booking may not be confirmed until the payment issue is resolved.\n\nThat could happen because a card has expired, the bank declines the transaction, there are insufficient funds or additional authentication is required.\n\nIf a payment fails, you should be able to try again or use another available payment method.\n\nWe do not want a cleaner travelling to a booking that has not been properly confirmed.",
      },
      {
        question: "Can I update my payment method?",
        answer:
          "Yes, where the platform allows it before the relevant payment is completed.\n\nIf a card expires or you simply want to use a different payment method for a future booking, you should be able to update it through the appropriate Mundoria payment process.\n\nFor security, card information should not be sent through ordinary messages or given directly to the cleaner.",
      },
      {
        question: "Will my payment details be stored?",
        answer:
          "Mundoria does not store your full card number.\n\nCard payments are processed by Stripe. Where you choose to keep a payment method for future bookings, Stripe stores the payment details securely and Mundoria only keeps the related Stripe references needed to run the booking.\n\nYou should never send card details to a cleaning professional or through ordinary messages.",
      },
      {
        question: "Can I get a refund if my booking is cancelled?",
        answer:
          "That depends on when the booking is cancelled and who cancelled it.\n\nIf you cancel:\n\n• 48 hours or more before the start time: no cancellation fee, and the payment authorisation is released\n• Between 24 and 48 hours before the start time: a 50% cancellation fee applies\n• Less than 24 hours before the start time: the full booking amount is retained\n\nIf Mundoria or the assigned professional cannot fulfil the booking and no suitable replacement is arranged, the payment is handled under the cancellation and replacement process rather than leaving you without a clear next step.\n\nThe same notice windows are shown in the booking and cancellation journey.",
      },
    ],
  },
  {
    id: "professionals",
    title: "Cleaning Professionals",
    description: "Who cleans, vetting, training and independence.",
    items: [
      {
        question: "Who carries out Mundoria bookings?",
        answer:
          "Mundoria bookings are carried out by independent cleaning professionals who have gone through the Mundoria onboarding process before becoming eligible for suitable jobs on the platform.\n\nThey are the people who come to your home, office or other booked space and carry out the agreed cleaning.\n\nMundoria manages the experience around the booking, while the cleaning itself is completed by the professional matched to the job.",
      },
      {
        question: "Are Mundoria cleaners employees?",
        answer:
          "No.\n\nMundoria works with independent cleaning professionals rather than employing every cleaner as a traditional employee.\n\nThey operate independently while using the Mundoria platform to access suitable bookings.\n\nThat does not mean anyone can simply sign up and immediately start entering customers' homes.\n\nProfessionals still need to complete Mundoria's onboarding and meet the relevant requirements before they can accept appropriate bookings.",
      },
      {
        question: "Are Mundoria cleaning professionals independent?",
        answer:
          "Yes.\n\nCleaning professionals using Mundoria operate as independent professionals.\n\nThey can make decisions about the bookings they accept, subject to the platform's requirements and the services they have been approved to carry out.\n\nMundoria's role is to help organise the booking, matching, information, payment and support around the service.",
      },
      {
        question: "How does someone become a Mundoria cleaning professional?",
        answer:
          "Joining Mundoria involves more than creating a profile.\n\nApplicants go through a structured onboarding process designed to help Mundoria understand who they are, whether they are eligible to work, what experience they have and which services they are genuinely suited to carry out.\n\nThat process can include identity checks, right-to-work information where applicable, UTR details where relevant, DBS checks, references, insurance requirements, experience review and an appointment with the Mundoria team.\n\nProfessionals also complete Mundoria's in-house training and assessment before being approved for the relevant types of bookings.\n\nThe purpose is not to create paperwork for the sake of it.\n\nIt is to make sure there is real due diligence behind the person being matched to a customer's space.",
      },
      {
        question: "Are Mundoria cleaners vetted?",
        answer:
          "Yes.\n\nMundoria carries out a structured vetting and onboarding process before a professional can begin taking suitable bookings.\n\nThat can include identity verification, eligibility checks, DBS checks, relevant experience, references, insurance requirements, right-to-work information where applicable and other onboarding documentation.\n\nWe also assess whether the professional is suited to the particular types of cleaning they want to carry out.\n\nVetting does not mean making unrealistic promises about human behaviour.\n\nIt means doing sensible due diligence before someone is allowed onto the platform.",
      },
      {
        question: "Does Mundoria carry out DBS checks?",
        answer:
          "Yes.\n\nDBS checks form part of Mundoria's onboarding process.\n\nThis is particularly important because cleaning professionals may be entering private homes, workplaces and other spaces where customers reasonably expect a higher level of due diligence.\n\nWhere a particular setting has additional safeguarding requirements, those should also be considered separately.",
      },
      {
        question: "Are Mundoria cleaners insured?",
        answer:
          "Cleaning professionals are required to have appropriate insurance before taking relevant bookings through Mundoria.\n\nInsurance is part of the onboarding and compliance process rather than something we expect customers to investigate themselves.\n\nThe type of cover required should be appropriate to the work being carried out.",
      },
      {
        question: "Do Mundoria cleaners receive training?",
        answer:
          "Yes.\n\nMundoria includes training as part of the onboarding process.\n\nThe aim is to make sure professionals understand the standards expected on the platform, how different services work and what customers should reasonably expect during a booking.\n\nTraining also helps create more consistency across areas such as communication, cleaning standards, handling customer preferences and understanding the limits of the service.",
      },
      {
        question: "Does Mundoria provide in-house training?",
        answer:
          "Yes.\n\nMundoria provides its own in-house training and assessment before professionals are approved for suitable types of work.\n\nThis matters because experience alone does not automatically mean someone understands how Mundoria expects a booking to be handled.\n\nThe training helps bring professionals onto the same page around service standards, customer expectations and how the platform works.",
      },
      {
        question: "Does Mundoria assess cleaning experience?",
        answer:
          "Yes.\n\nWe look at relevant experience as part of deciding what types of bookings a professional should be able to accept.\n\nNot every type of cleaning is the same.\n\nSomeone may be very experienced with regular household cleaning but have little experience with end-of-tenancy work or commercial premises.\n\nThat is why Mundoria looks at the experience relevant to the service rather than treating \"cleaning experience\" as one broad category.",
      },
      {
        question: "Does Mundoria check references?",
        answer:
          "References can form part of Mundoria's onboarding process.\n\nThey help provide additional information about a professional's previous work, reliability and experience.\n\nWhere references are requested, we prefer information that can be reasonably verified rather than simply accepting a name and phone number without context.",
      },
      {
        question: "Does Mundoria verify identity?",
        answer:
          "Yes.\n\nIdentity verification is part of the onboarding process.\n\nBefore a professional can take suitable bookings, Mundoria needs to be able to establish that the person joining the platform is who they say they are.\n\nThis sits alongside the other eligibility and compliance checks carried out during onboarding.",
      },
      {
        question: "Does Mundoria check right-to-work information?",
        answer:
          "Yes, where right-to-work checks are applicable.\n\nMundoria reviews the relevant eligibility information as part of onboarding.\n\nThe exact documents or verification method can depend on the professional's circumstances.\n\nThis is one of the reasons onboarding is more involved than simply creating an online profile.",
      },
      {
        question: "Does Mundoria check whether professionals are insured?",
        answer:
          "Yes.\n\nAppropriate insurance is one of the requirements Mundoria checks as part of the professional onboarding process.\n\nProfessionals should not simply state that they are insured and move on.\n\nThe relevant documentation needs to be provided and reviewed as part of their eligibility to take bookings through the platform.",
      },
      {
        question: "Does Mundoria check UTR details where relevant?",
        answer:
          "Yes.\n\nWhere a cleaning professional is operating as a self-employed sole trader and a UTR is relevant to their status, Mundoria can request and review that information as part of onboarding.\n\nIt forms part of understanding the professional's working status and making sure the platform has the appropriate information on record.",
      },
      {
        question: "Can anyone simply sign up and start taking bookings?",
        answer:
          "No.\n\nSomeone can apply to join Mundoria, but that does not mean they immediately become available to customers.\n\nThey need to complete the relevant onboarding process first.\n\nThat includes the required checks, documents, training and assessment.\n\nOnly after the necessary requirements have been completed can the professional become eligible for suitable bookings.\n\nFor us, there is an important difference between signing up and being approved to work through Mundoria.",
      },
      {
        question: "Are cleaners trained for specific types of cleaning?",
        answer:
          "Yes.\n\nMundoria takes service type into account because different cleaning jobs require different levels of experience and understanding.\n\nRegular home cleaning is different from an end-of-tenancy clean.\n\nCommercial cleaning is different from cleaning a short-let between guests.\n\nRecovery Cleaning also requires professionals to understand the more sensitive circumstances that may sit around the booking, even though the service itself remains cleaning.\n\nThe aim is to make sure a professional is not accepting a type of job simply because the word \"cleaning\" appears in the title.",
      },
      {
        question: "How does Mundoria decide which services a professional can accept?",
        answer:
          "Mundoria looks at the information gathered during onboarding, including relevant experience, training, assessment and the professional's practical ability to carry out the service.\n\nThat helps determine which categories of work they are suited to accept.\n\nA professional may be approved for regular home cleaning but not yet for a more detailed commercial or end-of-tenancy service.\n\nThat can change as their experience and training develop.\n\nWe would rather match someone to work they are genuinely prepared for than make every booking available to every cleaner on the platform.",
      },
    ],
  },
  {
    id: "matching",
    title: "Matching",
    description: "How Mundoria chooses and assigns cleaners.",
    items: [
      {
        question: "How does Mundoria choose a cleaner for my booking?",
        answer:
          "Mundoria does not want matching to be a case of simply giving the job to whoever happens to be free first.\n\nWe look at the booking itself.\n\nThat can include the type of cleaning, your location, the expected duration, the professional's availability, relevant experience, travel practicality, service suitability and any important preferences attached to the booking.\n\nThe aim is to make the match make sense for both sides.\n\nA cleaner may be available, but if the location, timing or type of work is not a good fit, that does not automatically make them the right person for the booking.",
      },
      {
        question: "Does Mundoria match cleaners based on experience?",
        answer:
          "Yes.\n\nRelevant experience is one of the things Mundoria can consider when arranging a booking.\n\nNot every cleaning job is the same.\n\nSomeone may have strong experience with regular home cleaning but less experience with end-of-tenancy work, office cleaning or short-let turnovers.\n\nThat is why we look at the type of service being booked and whether the professional has suitable experience for that kind of work.\n\nWe would rather make a sensible match than treat every cleaner as interchangeable.",
      },
      {
        question: "Does location affect matching?",
        answer:
          "Yes.\n\nLocation matters because the professional needs to be able to get to the booking practically and on time.\n\nA good match is not just about skill.\n\nIt also needs to make sense geographically.\n\nThat helps reduce unnecessary travel, makes the schedule more realistic and lowers the chance of avoidable delays.",
      },
      {
        question: "Does travel distance affect matching?",
        answer:
          "Yes.\n\nTravel distance is one of the practical things that can affect whether a booking makes sense for a particular professional.\n\nMundoria considers the cleaner's starting area, travel radius and the location of the job.\n\nA cleaner who is technically available but would need to travel an unreasonable distance may not be the best match.\n\nWe want the booking to be workable, not just possible on paper.",
      },
      {
        question: "Does availability affect matching?",
        answer:
          "Yes.\n\nThe professional needs to be genuinely available for the date, time and expected length of the booking.\n\nThat sounds obvious, but it matters.\n\nA three-hour clean needs a professional with enough time to complete it properly, not someone with another booking starting halfway through.\n\nAvailability is therefore considered alongside the service type, location and other booking requirements.",
      },
      {
        question: "Does reliability affect matching?",
        answer:
          "Yes.\n\nReliability matters.\n\nMundoria can take into account things such as attendance history, cancellations, no-shows and overall booking performance when deciding which professionals are suitable for future work.\n\nThe goal is not to punish someone for one genuine emergency.\n\nIt is to recognise patterns.\n\nIf someone repeatedly lets customers down, that should matter when the platform decides whether they are a sensible match for another booking.",
      },
      {
        question: "Can I choose my cleaner?",
        answer:
          "Mundoria is designed around matching rather than asking customers to search through an endless directory of profiles.\n\nYou tell us what you need and the platform helps arrange a suitable professional based on the booking.\n\nWhere the product allows customers to express preferences or request someone they have used before, those preferences can be taken into account.\n\nBut availability and suitability still matter.\n\nThe goal is to reduce the amount of searching and comparing you have to do yourself.",
      },
      {
        question: "Can I request a female cleaner?",
        answer:
          "You can add a preference for a female cleaning professional where the booking process allows it.\n\nWe understand that some customers may feel more comfortable with a particular preference because of personal, cultural or household circumstances.\n\nMundoria can try to take that preference into account, but it should not be treated as an absolute guarantee because suitable availability can vary.\n\nIf the preference is important to you, make it clear when booking rather than after the match has already been arranged.",
      },
      {
        question: "Can I request a male cleaner?",
        answer:
          "Yes, where that preference can be supported.\n\nAs with any cleaner preference, availability and suitability still matter.\n\nIf you have a specific reason or simply feel more comfortable with that preference, you can include it in the booking where the option is available.\n\nWe will try to take it into account without promising something we may not always be able to guarantee.",
      },
      {
        question: "Can I request the same cleaner again?",
        answer:
          "Yes, where that professional is available and remains a suitable match for the booking.\n\nIf you have had a good experience with someone and would prefer them again, continuity can be useful because they already understand the space and your preferences.\n\nMundoria can try to keep that relationship going where practical.\n\nIf the cleaner is unavailable, the platform can look for another suitable professional instead.",
      },
      {
        question: "Can I ask for a different cleaner?",
        answer:
          "Yes.\n\nSometimes the first match is not the right fit.\n\nYou should be able to request a different cleaning professional for future bookings.\n\nYou do not need to feel awkward about that.\n\nYour home or workplace is a personal space, and comfort matters.\n\nIf there was a specific issue with the clean, it is also helpful to tell Mundoria what happened so the problem can be reviewed properly.",
      },
      {
        question: "What happens if my preferred cleaner is unavailable?",
        answer:
          "If the professional you prefer is unavailable, Mundoria can look for another suitable cleaner using the information already attached to your booking.\n\nThat may include the service type, location, expected duration, timing and relevant preferences.\n\nYou should not need to rebuild the booking from the beginning just because one person is unavailable.\n\nWhere possible, the aim is to preserve the booking rather than make you start again.",
      },
      {
        question: "Can I see information about the cleaner before the booking?",
        answer:
          "Yes.\n\nOnce a professional is matched to your booking, you can see useful information about them before they arrive. That can include their name, profile photo, ratings and relevant experience where available.\n\nYou can also browse cleaner profiles in Mundoria's directory. For a new booking, Mundoria matches a suitable professional based on the job rather than asking you to search through every profile yourself.",
      },
      {
        question: "Can cleaners choose which jobs they accept?",
        answer:
          "Yes.\n\nMundoria works with independent cleaning professionals, so they are not simply assigned every job automatically.\n\nProfessionals can decide whether a suitable booking works for them, subject to the way the platform handles availability and acceptance.\n\nThat is important because a good match should work for both the customer and the professional.\n\nA booking is more likely to go well when the person accepting it understands the work and is genuinely able to do it.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & Trust",
    description: "Checks, privacy and reporting concerns.",
    items: [
      {
        question: "Is it safe to book through Mundoria?",
        answer:
          "Mundoria puts a structured process around who can take bookings, how payments are handled and what information sits behind the booking.\n\nCleaning professionals go through onboarding, identity and eligibility checks, DBS checks, insurance requirements, experience review and Mundoria's in-house training and assessment before becoming eligible for suitable work.\n\nPayments are handled through the platform using Stripe rather than through private arrangements between customers and cleaners.\n\nNo platform can honestly promise that risk disappears completely.\n\nWhat we can do is put sensible checks, clear processes and support around the booking so customers are not simply inviting an unknown person into their home with no information behind them.",
      },
      {
        question: "What checks does Mundoria carry out on cleaners?",
        answer:
          "Mundoria's onboarding process can include identity verification, right-to-work information where applicable, UTR details where relevant, DBS checks, references, insurance requirements, experience review and an appointment with the Mundoria team.\n\nProfessionals also complete Mundoria's in-house training and assessment before being approved for suitable service categories.\n\nThe purpose is straightforward.\n\nWe want to understand who the person is, whether they are eligible to work, whether they have the experience they claim to have and whether they are suited to the types of bookings they want to accept.",
      },
      {
        question: "Are cleaners DBS checked?",
        answer:
          "Yes.\n\nDBS checks form part of Mundoria's onboarding process.\n\nThat is particularly important because professionals may be entering private homes, workplaces and other spaces where customers reasonably expect proper due diligence.\n\nA DBS check is one part of the wider onboarding process, not the only thing Mundoria relies on.",
      },
      {
        question: "Are cleaners insured?",
        answer:
          "Professionals are required to have appropriate insurance before taking relevant bookings through Mundoria.\n\nInsurance is checked as part of the onboarding and compliance process.\n\nThe cover needs to be suitable for the kind of cleaning work the professional intends to carry out.\n\nWe do not want customers to have to investigate that themselves each time they make a booking.",
      },
      {
        question: "How does Mundoria protect customers?",
        answer:
          "Protection starts before the clean happens.\n\nMundoria carries out onboarding and due diligence on professionals, keeps the booking information connected in one place, processes payments through Stripe and provides a route for customers to report issues if something goes wrong.\n\nMatching also considers more than simple availability.\n\nExperience, reliability, location and other practical factors can all affect whether someone is suitable for a booking.\n\nThe point is not to create the impression that nothing can ever go wrong.\n\nIt is to make sure there is a real process around the booking if something does.",
      },
      {
        question: "How does Mundoria handle payments safely?",
        answer:
          "Payments are processed through Stripe.\n\nThat means the card transaction is handled through Stripe's payment infrastructure rather than customers being asked to send card details or arrange private transfers with cleaning professionals.\n\nCustomers should always pay through the official Mundoria payment journey.\n\nKeeping payment on the platform also means there is a clearer record of the booking and the amount connected to it.",
      },
      {
        question: "What information will my cleaner see about me?",
        answer:
          "The cleaner receives the information needed to carry out the booking.\n\nThat can include your name, the property address, access instructions, the service booked, expected duration, relevant preferences and any notes that affect how the clean should be completed.\n\nThey do not receive your full payment card details. Payment stays on the Mundoria platform through Stripe.\n\nFor more detail on how personal data is handled, see Mundoria's Privacy Policy.",
      },
      {
        question: "How is my personal information handled?",
        answer:
          "Mundoria collects and uses personal information to arrange bookings, process payments, communicate with you and support the service.\n\nInformation is shared with a cleaning professional only where it is relevant to the booking. Payment card details are handled by Stripe. Mundoria does not store full card numbers.\n\nFull details are set out in Mundoria's Privacy Policy.",
      },
      {
        question: "Should I leave valuables out during the clean?",
        answer:
          "We recommend putting valuables, cash, important documents, medication and particularly sentimental items somewhere secure before the clean.\n\nThat is sensible practice whenever someone is working in your home.\n\nIt also protects both sides from unnecessary uncertainty if something later cannot be found.\n\nYou do not need to empty the house.\n\nJust secure the things you would normally prefer not to leave unattended.",
      },
      {
        question: "Can I leave a cleaner alone in my home?",
        answer:
          "That is your choice.\n\nSome customers prefer to stay home while cleaning takes place.\n\nOthers provide secure access and leave the professional to complete the booking while they are out.\n\nIf you decide not to be there, make sure access instructions are clear and valuables or sensitive belongings are stored appropriately.\n\nMundoria's onboarding process is there to provide more information and due diligence around professionals, but the final decision about whether you are comfortable leaving the property remains yours.",
      },
      {
        question: "What happens if I have a safety concern?",
        answer:
          "Tell Mundoria as soon as possible.\n\nIf the concern is happening during a booking and you feel unsafe, prioritise your immediate safety first.\n\nOnce you are in a safe position, contact Mundoria and explain what happened so the issue can be reviewed.\n\nSafety concerns should not be treated like ordinary service feedback.\n\nThey need to be taken seriously and handled through the appropriate internal process.",
      },
      {
        question: "How do I report inappropriate behaviour?",
        answer:
          "Contact Mundoria and provide as much relevant information as you reasonably can about what happened.\n\nThat may include the booking, the behaviour you experienced, when it happened and any supporting information that helps us understand the situation.\n\nThe matter should then be reviewed separately from an ordinary cleaning-quality complaint.\n\nIf the issue involves immediate danger or potentially criminal behaviour, customers should also contact the appropriate emergency or law-enforcement service.",
      },
      {
        question: "What happens if a cleaner breaches my instructions?",
        answer:
          "It depends on what happened.\n\nIf the professional accidentally misunderstood a preference, that may be something that can be reviewed and corrected.\n\nIf they entered a room you had clearly marked as off-limits, used a product you had specifically said not to use or ignored another important instruction, tell Mundoria.\n\nThe booking information can then be reviewed alongside what happened.\n\nWhere appropriate, the issue may affect future matching, the professional's standing on the platform or how the complaint is handled.\n\nCustomers should be able to expect that clear instructions attached to the booking are taken seriously.",
      },
    ],
  },
  {
    id: "cancellations",
    title: "Cancellations & Changes",
    description: "Cancel, reschedule and what fees may apply.",
    items: [
      {
        question: "Can I cancel my booking?",
        answer:
          "Yes.\n\nIf your plans change, you can cancel your booking through the Mundoria booking process.\n\nThe exact outcome will depend on how close the cancellation is to the scheduled clean and the cancellation terms that apply at the time.\n\nWe want those rules to be clear before you book, not something you only discover when you try to cancel.",
      },
      {
        question: "Can I reschedule my booking?",
        answer:
          "Yes, where another suitable date and time is available.\n\nIf something changes and you still want the clean, rescheduling may make more sense than cancelling altogether.\n\nThe earlier you make the change, the easier it is to find another suitable slot and update the professional's schedule.\n\nAny applicable rescheduling terms should be shown clearly before the change is confirmed.",
      },
      {
        question: "How much notice do I need to cancel?",
        answer:
          "You can cancel through the Mundoria booking process before the clean starts.\n\nTo cancel without a fee, cancel at least 48 hours before the scheduled start time.\n\nCancellations between 24 and 48 hours before the start time incur a 50% fee. Cancellations less than 24 hours before the start time incur the full booking amount.",
      },
      {
        question: "Is there a cancellation fee?",
        answer:
          "Yes, for late cancellations.\n\n• 48 hours or more before the start time: no fee\n• Between 24 and 48 hours before the start time: 50% of the booking total\n• Less than 24 hours before the start time: 100% of the booking total\n\nThose windows are applied when you cancel through Mundoria and are shown as part of the cancellation process.",
      },
      {
        question: "Is there a rescheduling fee?",
        answer:
          "No fee if you reschedule at least 24 hours before the scheduled start time and another suitable slot is available.\n\nWithin 24 hours of the start time, the booking cannot be moved as a free reschedule. You would need to cancel under the cancellation terms and book again if you still want the clean.",
      },
      {
        question: "Can I change the booking date?",
        answer:
          "Yes, where another suitable date is available.\n\nYou can request a different date through the Mundoria booking process.\n\nChanging a date may affect professional availability, particularly if you originally requested a specific cleaner.\n\nIf you are able to make the change early, there will usually be more options available.",
      },
      {
        question: "Can I change the booking time?",
        answer:
          "Yes, subject to availability.\n\nIf you need the clean earlier or later, you can request another available time.\n\nA change in time may mean the original professional is no longer available, so Mundoria may need to look for another suitable match.\n\nThe booking is only updated once the new arrangement has been confirmed.",
      },
      {
        question: "Can I change the service I booked?",
        answer:
          "Yes, where the new service can still be accommodated.\n\nFor example, if you booked Regular Cleaning and later realise the home actually needs a Deep Clean, the booking may need more time, different products or a professional suited to that type of work.\n\nThat can also change the price.\n\nIt is better to update the booking before the cleaner arrives than expect a different level of service to be squeezed into the original time.",
      },
      {
        question: "Can I add more hours?",
        answer:
          "Yes, where the professional has enough availability.\n\nIf you realise that the home or workplace needs more time than originally booked, request the additional hours as early as possible.\n\nThe cleaner may have another appointment afterwards, so extra time cannot always be added on the day.\n\nIf more time is available, the additional cost should be shown before the booking is changed.",
      },
      {
        question: "Can I reduce the number of hours?",
        answer:
          "Usually, yes, provided the change is made within the applicable booking terms.\n\nKeep in mind that reducing the hours may mean fewer areas can be completed.\n\nIf you shorten the booking, it is useful to tell us which rooms or tasks should be prioritised so the professional knows where to focus the remaining time.",
      },
      {
        question: "Can I change my property details?",
        answer:
          "Yes.\n\nIf you entered something incorrectly or the booking circumstances have changed, update the information as soon as possible.\n\nThat might include the number of rooms, access information, parking, pets, property condition or the areas you want cleaned.\n\nSome changes can affect the estimated time, price or suitability of the original professional, so accuracy matters.",
      },
      {
        question: "What happens if my cleaner cancels?",
        answer:
          "If the assigned professional becomes unavailable, Mundoria should not simply send you a cancellation message and leave you to start again.\n\nThe booking information is already there.\n\nThat means Mundoria can use the service type, location, expected duration, timing and relevant preferences to look for another suitable professional where possible.\n\nWe cannot promise a replacement will always be available, but the cancellation should start a recovery process rather than become your problem to solve alone.",
      },
      {
        question: "What happens if my cleaner is unavailable?",
        answer:
          "If your preferred or usual professional cannot attend, Mundoria can look at whether another suitable professional is available for the booking.\n\nIf you would rather wait for the same cleaner, that may also be possible depending on your schedule.\n\nThe best option depends on whether keeping the original appointment or keeping the same professional matters more to you.",
      },
      {
        question: "Will Mundoria find a replacement?",
        answer:
          "Mundoria will try to find a suitable replacement where availability allows.\n\nBecause the booking information is already known, you should not have to explain the entire job again from the beginning.\n\nHowever, location, timing and professional availability can sometimes make a replacement impossible.\n\nWe would rather be honest about that than claim a replacement is guaranteed every time.",
      },
      {
        question: "Can Mundoria guarantee a replacement?",
        answer:
          "No.\n\nWe can make the replacement process part of how the platform responds to a cancellation, but we cannot guarantee that a suitable professional will always be available at exactly the same time.\n\nA last-minute cancellation in a busy area may be easier to recover than one in a location where there are fewer professionals available.\n\nThe promise should be that Mundoria will try to recover the booking properly, not that we can control every circumstance.",
      },
      {
        question: "Can Mundoria guarantee my booking will never be cancelled?",
        answer:
          "No.\n\nIllness, emergencies, transport problems and other unexpected situations can happen.\n\nNo honest platform can promise otherwise.\n\nWhat Mundoria can do is reduce avoidable problems through better matching and reliability tracking, and have a clear process when an unavoidable cancellation does happen.\n\nThe goal is not pretending nothing ever goes wrong.\n\nIt is dealing with it better when it does.",
      },
      {
        question: "What happens if a replacement cannot be found?",
        answer:
          "If Mundoria cannot find a suitable replacement, you will be given clear options.\n\nThat usually means moving the booking to another available time, or releasing or refunding the payment according to the cancellation terms for a booking Mundoria could not fulfil.\n\nYou should not be left without a next step once it is clear that the original appointment cannot go ahead.",
      },
      {
        question: "What happens if my cleaner is late?",
        answer:
          "If the professional is running late, the delay should be communicated where possible.\n\nSmall delays can happen because of traffic, transport or an earlier booking taking longer than expected.\n\nIf the delay becomes significant or means the booking cannot be completed properly, contact Mundoria so the situation can be reviewed. Where the professional does not attend and cannot be replaced in time, the booking is handled through Mundoria's no-show and replacement process.",
      },
      {
        question: "What happens if I am late getting home?",
        answer:
          "If you are providing access in person and realise you are going to be late, let Mundoria know as soon as possible.\n\nOnce the cleaner has arrived and checked in, there is a 5-minute grace period to let them in. After that, a waiting charge of £0.50 per minute can apply.\n\nThe professional may also have another booking afterwards and may not be able to wait indefinitely. Where possible, arrange alternative access if you cannot get home in time.",
      },
      {
        question: "What happens if the cleaner cannot get into the property?",
        answer:
          "If the professional arrives and cannot access the property, contact Mundoria as soon as possible.\n\nOnce the cleaner has checked in, there is a 5-minute grace period. After that, a waiting charge of £0.50 per minute can apply while access is sorted out.\n\nIf access can be resolved quickly, the booking may still continue. If it cannot, the clean may need to be shortened, rescheduled or cancelled depending on the circumstances and remaining time.",
      },
      {
        question: "Can I cancel a recurring clean?",
        answer:
          "Yes.\n\nRecurring cleaning does not lock you in forever. You can cancel future visits through Mundoria.\n\nEach upcoming visit follows the same cancellation notice windows as a one-off booking: free at 48 hours or more before the start time, 50% between 24 and 48 hours, and 100% within 24 hours.",
      },
      {
        question: "Can I pause a recurring clean?",
        answer:
          "Yes.\n\nIf you are going away, renovating, changing your routine or simply do not need cleaning for a period, you should be able to pause upcoming visits.\n\nYou can then resume the schedule later, subject to availability.\n\nIf you usually have the same professional, a long pause may affect whether they are still available when you return.",
      },
    ],
  },
  {
    id: "problems",
    title: "Problems During or After a Clean",
    description: "Missed areas, damage, complaints and next steps.",
    items: [
      {
        question: "What if I am unhappy with the cleaning?",
        answer:
          "Tell Mundoria as soon as possible.\n\nExplain what you expected, what happened and which areas you believe were not completed properly.\n\nThe aim is to understand the problem rather than immediately assume either side is right or wrong.\n\nThe booking details, time available, instructions and service booked can all help us review what happened.\n\nIf the issue is clear, Mundoria can then decide the appropriate next step under the complaints and service-resolution policy.",
      },
      {
        question: "What if an area was missed?",
        answer:
          "Let us know.\n\nIf an area was part of the agreed scope but was missed, tell Mundoria which area it was and provide a photo where that helps.\n\nSometimes there may be a straightforward explanation, such as an access problem or the booked time running out.\n\nOther times it may simply have been overlooked.\n\nEither way, the issue should be reviewed rather than ignored.",
      },
      {
        question: "What if the cleaner runs out of time?",
        answer:
          "The cleaner should focus on the priorities within the time booked.\n\nIf there is more work than can reasonably be completed, it is better to finish the most important areas properly than rush through everything.\n\nThat is why accurate booking information and clear priorities matter.\n\nIf the home repeatedly needs more time than originally estimated, the booking duration should be reviewed for future visits.",
      },
      {
        question: "What if I booked too few hours?",
        answer:
          "The cleaner can work through the most important areas within the time available.\n\nIf they have more availability that day, additional time may sometimes be added once the extra cost is agreed.\n\nIf not, the remaining work may need to be left for another booking.\n\nFor future cleans, the estimated duration can be adjusted so the same problem does not keep happening.",
      },
      {
        question: "What if I booked too many hours?",
        answer:
          "You are charged for the cleaning time you booked and confirmed, even if the cleaner finishes sooner.\n\nIf the home regularly needs less time than estimated, reduce the hours on future bookings so the price better matches the work.\n\nIt is better to adjust the schedule than to keep repeating an estimate that no longer fits.",
      },
      {
        question: "Can I report a problem after the cleaner leaves?",
        answer:
          "Yes.\n\nYou may not notice something until after the professional has gone.\n\nIf there is an issue, report it to Mundoria as soon as reasonably possible and explain what happened.\n\nThe sooner the issue is reported, the easier it is to review the booking while the details are still clear.",
      },
      {
        question: "Should I provide photos if I have a complaint?",
        answer:
          "Where photos help explain the issue, yes.\n\nFor example, if an area was missed, something was damaged or the condition of a surface is part of the complaint, photos can make it easier to understand what happened.\n\nYou should not feel you need to photograph your entire home.\n\nOnly provide what is relevant to the issue you are reporting.",
      },
      {
        question: "What happens if something is accidentally damaged?",
        answer:
          "Report it to Mundoria as soon as possible.\n\nProvide details of what was damaged, what happened if known and photographs where useful. Mundoria will review the booking with the cleaning professional and handle the issue through the platform's dispute and insurance process.\n\nCompensation is not automatic. The outcome depends on what happened, the evidence available and the professional's insurance cover.",
      },
      {
        question: "What happens if something goes missing?",
        answer:
          "First, check the surrounding area in case the item was moved temporarily during cleaning.\n\nIf you still cannot locate it and believe it may be connected to the booking, contact Mundoria promptly. Provide clear information about the item, where it was last seen and why you believe the issue may relate to the clean.\n\nMundoria will review the matter through the appropriate support process. Where criminal behaviour is suspected, you should also contact the police.",
      },
      {
        question: "What happens if the cleaner breaks something?",
        answer:
          "Accidents can happen.\n\nIf something is broken during the clean, the professional should report it rather than hide it. You should also contact Mundoria if you discover the damage afterwards.\n\nMundoria will review the booking and circumstances through the dispute process. Any compensation depends on what happened, the evidence available and the professional's insurance.",
      },
      {
        question: "What happens if the cleaner damages my property?",
        answer:
          "Tell Mundoria promptly and provide relevant information and photographs.\n\nWe will review what was damaged, how it happened and whether the item or surface was being cleaned as part of the booking. The issue is then handled through Mundoria's dispute and insurance process.\n\nThere is no automatic payout for every report. Each case is reviewed on its facts.",
      },
      {
        question: "Will Mundoria pay for damage?",
        answer:
          "Not automatically.\n\nWhether compensation applies depends on what happened, the evidence available, the cleaning professional's insurance and Mundoria's review of the booking.\n\nReport damage through Mundoria as soon as possible so the case can be assessed properly. We do not promise that every reported item will be paid for regardless of the circumstances.",
      },
      {
        question: "Are cleaners insured for accidental damage?",
        answer:
          "Yes.\n\nCleaning professionals are required to have appropriate insurance before taking relevant bookings through Mundoria.\n\nIf accidental damage occurs, the insurance and claims process may apply depending on the circumstances. Contact Mundoria so the booking can be reviewed and the next steps explained.",
      },
      {
        question: "Can Mundoria guarantee every stain will be removed?",
        answer:
          "No.\n\nSome stains can be improved or removed through normal cleaning.\n\nOthers may have permanently affected the material or surface.\n\nThe result can depend on what caused the stain, how long it has been there, the surface involved and whether previous products have already been used on it.\n\nWe would rather set realistic expectations than promise a perfect result that ordinary cleaning cannot guarantee.",
      },
      {
        question: "Can Mundoria remove permanent marks?",
        answer:
          "Not necessarily.\n\nCleaning can remove dirt and some types of staining, but it cannot reverse physical damage.\n\nScratches, burns, permanent discolouration, worn finishes, damaged grout, deeply set stains or other material damage may remain even after the surface has been cleaned thoroughly.\n\nIf something is damaged rather than dirty, cleaning may not change it.",
      },
      {
        question: "Can a cleaner refuse to clean my property?",
        answer:
          "Yes, in certain circumstances.\n\nCleaning professionals should not be expected to continue working in conditions that are unsafe, seriously unhygienic or outside Mundoria's service scope.\n\nThat may include serious biohazards, aggressive behaviour, dangerous animals, unsafe structures, severe pest activity or other risks the professional was not told about beforehand.\n\nThis is about safety, not judging the condition of someone's home.",
      },
      {
        question: "What happens if the property is unsafe?",
        answer:
          "The professional may stop or refuse the clean.\n\nIf a situation presents a genuine risk to health or safety, the cleaner should not be expected to continue simply because the booking has already started.\n\nMundoria will review the circumstances and explain what happens to the booking and payment. Where possible, tell us about unusual conditions before the booking so the job can be assessed properly.",
      },
      {
        question: "What happens if there is serious mould?",
        answer:
          "Major mould is outside Mundoria's current cleaning scope.\n\nA small amount of ordinary surface mould in a bathroom may sometimes be treated during normal cleaning where appropriate.\n\nSignificant mould growth is different.\n\nIt can be connected to damp, leaks, ventilation or building problems and may require specialist remediation rather than ordinary cleaning.\n\nIn those situations, the professional should not attempt work they are not trained or equipped to carry out.",
      },
      {
        question: "What happens if there are pests?",
        answer:
          "If there is a serious pest problem, the cleaner may not be able to continue.\n\nPest infestations can create hygiene and safety risks and may need to be dealt with by a pest-control professional before normal cleaning takes place.\n\nIf you already know there is an active infestation, tell Mundoria before booking.\n\nThat allows us to avoid sending someone into a situation that sits outside the service.",
      },
      {
        question: "What happens if there is a biohazard?",
        answer:
          "Biohazard cleaning is outside Mundoria's current service scope.\n\nThat includes situations involving hazardous bodily fluids, dangerous contamination or other materials requiring specialist protective equipment, handling and disposal procedures.\n\nA specialist biohazard-cleaning provider should be used instead.\n\nCleaning professionals should not be expected to take on that kind of work as part of an ordinary home or commercial clean.",
      },
      {
        question: "How quickly should I report a problem?",
        answer:
          "As soon as you reasonably can, and ideally within 48 hours of the clean.\n\nThe sooner Mundoria hears about an issue, the easier it is to review while the details are still fresh. For cleaning-quality concerns, damage or missing items, report them promptly through Mundoria support.\n\nFor immediate safety concerns, report them straight away once you are in a safe position.",
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews & Feedback",
    description: "Ratings, reviews and how feedback is used.",
    items: [
      {
        question: "Can I rate my cleaner?",
        answer:
          "Yes.\n\nAfter a completed booking, you should be able to rate the cleaning professional who carried out the job.\n\nThe rating is there to reflect your actual experience, not to pressure you into leaving a perfect score.\n\nIf the clean went well, say so.\n\nIf something was not right, be honest about that too.\n\nThe useful feedback is the feedback that tells us what genuinely happened.",
      },
      {
        question: "Can I leave a review after my booking?",
        answer:
          "Yes.\n\nYou should be able to leave a review after your booking is completed.\n\nThat can include your experience of the cleaning itself, whether the professional arrived as expected, how well the booking was handled and anything else that stood out.\n\nReviews help future customers understand the experience more clearly, but they also help Mundoria see where the service is working well and where something needs attention.",
      },
      {
        question: "Does Mundoria use customer feedback when matching cleaners?",
        answer:
          "Yes.\n\nCustomer feedback can form part of the wider picture Mundoria uses when looking at a professional's performance.\n\nThat does not mean one review automatically decides everything.\n\nWe look at patterns.\n\nIf a professional consistently receives strong feedback, that matters.\n\nIf the same concern keeps appearing across different bookings, that matters too.\n\nReliability, experience, suitability, location and availability can all sit alongside customer feedback when deciding whether a professional remains a good fit for particular bookings.",
      },
      {
        question: "What happens if a professional receives poor reviews?",
        answer:
          "It depends on what the feedback says and whether there is a wider pattern.\n\nOne difficult booking does not automatically mean a professional should lose access to the platform.\n\nSometimes there may be a misunderstanding, an unrealistic expectation or circumstances that need to be reviewed properly.\n\nBut repeated concerns about quality, reliability, behaviour or failure to follow booking instructions should not be ignored.\n\nMundoria can review the professional's performance, look at previous bookings and decide whether further training, closer review, restrictions or another action is appropriate.\n\nThe point of feedback is not to collect stars.\n\nIt is to help us make better decisions.",
      },
      {
        question: "Can I update my review later?",
        answer:
          "Not currently.\n\nOnce you submit a rating for a booking, it is treated as final. You can leave one rating per completed booking.\n\nIf you need to tell Mundoria something further about the experience, use private feedback or support rather than trying to edit the submitted review.",
      },
      {
        question: "Can I give private feedback to Mundoria?",
        answer:
          "Yes.\n\nNot everything needs to be left as a public review.\n\nIf you want to tell Mundoria something privately about the cleaner, the booking or the overall experience, you should be able to do that through the appropriate support or feedback route.\n\nThat can be especially useful if the issue is sensitive, if you do not want it displayed publicly or if you want the team to review something in more detail.",
      },
      {
        question: "How does Mundoria use feedback to improve the service?",
        answer:
          "We use feedback to understand what customers are actually experiencing.\n\nThat can help us identify professionals who are doing consistently good work, spot recurring problems, improve training, refine matching and understand where the booking experience itself may need attention.\n\nFeedback can also help us see whether certain services need clearer expectations or better instructions.\n\nThe important thing is that feedback should lead somewhere.\n\nThere is little value in asking customers what they think if nothing changes afterwards.",
      },
    ],
  },
  {
    id: "recurring",
    title: "Recurring Bookings",
    description: "Weekly and fortnightly schedules you can pause or change.",
    items: [
      {
        question: "How do recurring bookings work?",
        answer:
          "Recurring bookings are for customers who want cleaning to happen on an ongoing schedule instead of arranging a new booking every time.\n\nYou choose the frequency that works for you, such as weekly or fortnightly, along with the preferred day, time and expected number of hours.\n\nThe idea is to make the routine easier once it is set up.\n\nYour property details and relevant preferences can stay connected to the booking so you do not have to explain the same things again every week.",
      },
      {
        question: "Can I book every week?",
        answer:
          "Yes.\n\nWeekly cleaning can be a good fit for homes that are used heavily, families with children or pets, shared households or anyone who simply prefers the home to be maintained more frequently.\n\nOnce the recurring schedule is set up, the aim is for the clean to become part of the normal rhythm of the week rather than something you have to keep arranging.",
      },
      {
        question: "Can I book every two weeks?",
        answer:
          "Yes.\n\nFortnightly cleaning is one of the most common recurring options.\n\nIt can work well for smaller households, homes that stay fairly tidy between visits or customers who want regular help without having someone come every week.\n\nIf you start fortnightly and later decide you need more frequent cleaning, the schedule can be reviewed.",
      },
      {
        question: "Can I choose the same day each week?",
        answer:
          "Yes, where suitable availability exists.\n\nIf you prefer the clean to happen every Monday, every Friday or on another regular day, Mundoria can try to build the recurring schedule around that.\n\nHaving a consistent day often makes the routine easier to remember and easier to plan around.\n\nAvailability may change occasionally, but the aim is to keep the schedule as consistent as reasonably possible.",
      },
      {
        question: "Can I choose the same time each visit?",
        answer:
          "Yes, where the professional and schedule allow it.\n\nA regular time can make recurring cleaning much easier to fit around work, school runs or other routines.\n\nHowever, we should not promise that the exact same time will always be available forever.\n\nProfessional schedules can change.\n\nWhere something needs to move, you should be told rather than discovering the change at the last minute.",
      },
      {
        question: "Can I change my recurring schedule?",
        answer:
          "Yes.\n\nYour cleaning schedule should be able to change when your life does.\n\nYou may need a different day because your work pattern has changed, or you may want to move from weekly to fortnightly cleaning.\n\nYou can request an adjustment, subject to availability and any notice terms that apply.\n\nThe goal is to make the routine useful, not rigid.",
      },
      {
        question: "Can I pause recurring cleaning?",
        answer:
          "Yes.\n\nIf you are going away, having building work done, staying elsewhere for a while or simply do not need the service for a period, you should be able to pause future visits.\n\nWhen you are ready, the schedule can be resumed subject to availability.\n\nIf the pause is long, the same professional may not necessarily still have the original slot available.",
      },
      {
        question: "Can I skip one visit?",
        answer:
          "Yes.\n\nYou should be able to skip an individual booking without cancelling your entire recurring arrangement.\n\nThat can be useful if you are away, have visitors staying, are renovating or simply do not need that week's clean.\n\nThe request should be made within the applicable notice period.\n\nOnce that visit is skipped, the recurring schedule can continue afterwards.",
      },
      {
        question: "Can I cancel recurring cleaning?",
        answer:
          "Yes.\n\nRecurring cleaning does not lock you in forever. You can cancel future visits through Mundoria.\n\nEach upcoming visit follows the same cancellation notice windows as a one-off booking: free at 48 hours or more before the start time, 50% between 24 and 48 hours, and 100% within 24 hours.",
      },
      {
        question: "Can I change the number of hours on future bookings?",
        answer:
          "Yes.\n\nIf you realise that the home consistently needs more or less time than originally booked, the recurring duration can be reviewed.\n\nYou may also want to change the hours temporarily if your circumstances change.\n\nAny adjustment to the booked time should be reflected clearly in the price before the next booking takes place.\n\nIt is better for the schedule to match what the home actually needs than to keep repeating an estimate that no longer makes sense.",
      },
      {
        question: "Can my cleaning preferences be saved?",
        answer:
          "Yes.\n\nThat is one of the things recurring cleaning should make easier.\n\nPreferences such as priority rooms, pets, access information, product choices and areas that should not be entered can remain connected to the booking where appropriate.\n\nThat means you should not need to explain the same details from scratch every time.\n\nIf something changes, you should be able to update the preferences rather than create an entirely new routine.",
      },
      {
        question: "Will I have the same cleaner every time?",
        answer:
          "Where possible, Mundoria will try to keep continuity.\n\nHaving the same professional can make recurring cleaning easier because they become familiar with the property, the routine and the things that matter to you.\n\nHowever, the same person cannot be guaranteed for every visit.\n\nHoliday, illness, schedule changes or other circumstances can affect availability.\n\nThe aim is to keep a good match going where practical, without making the whole recurring service dependent on one person's availability.",
      },
      {
        question: "What happens when my regular cleaner is away?",
        answer:
          "If your usual professional is unavailable, Mundoria can look for another suitable professional for that booking where possible.\n\nBecause the property details, service, schedule and preferences are already known, you should not have to start from the beginning.\n\nIf you would rather skip the clean or move it until your usual cleaner is available, that may also be possible depending on timing and availability.\n\nThe important thing is that you should know what is happening and have a clear next step rather than simply receiving a cancellation with no alternative.",
      },
    ],
  },
  {
    id: "access",
    title: "Access & Keys",
    description: "Key safes, reception, agents and access issues.",
    items: [
      {
        question: "Do I need to give the cleaner a key?",
        answer:
          "No.\n\nYou can provide access in whatever secure way works best for you.\n\nThat might mean being at home, using a key safe, arranging access through reception or concierge, leaving a key with an authorised person, or another agreed method.\n\nYou should not feel that giving a cleaner their own key is the default.\n\nThe important thing is that access is clear, secure and practical for the booking.",
      },
      {
        question: "Can I leave a key in a key safe?",
        answer:
          "Yes.\n\nIf you use a key safe, you can provide the relevant instructions as part of the booking.\n\nMake sure the code is correct and the key safe is accessible at the agreed time.\n\nIf the code changes, update the booking before the cleaner arrives.\n\nAccess information should be shared through the appropriate Mundoria booking process rather than in a public note.",
      },
      {
        question: "Can the cleaner collect keys from reception?",
        answer:
          "Yes, where the building allows it and the arrangement has been agreed beforehand.\n\nIf reception or concierge staff need the cleaner's name, booking details or identification before releasing the key, make sure that has been arranged.\n\nIt also helps to explain where the key should be returned afterwards.\n\nThe cleaner should not have to arrive and work out the process at the desk.",
      },
      {
        question: "Can the cleaner collect keys from an estate agent?",
        answer:
          "Yes, where it is practical and agreed before the booking.\n\nWe will need to know where the estate agent is, when the office is open, how the key can be collected and whether it needs to be returned afterwards.\n\nIf collecting the key involves extra travel, that should be known in advance because it can affect timing.",
      },
      {
        question: "Can I arrange access through a neighbour or family member?",
        answer:
          "Yes.\n\nA neighbour, relative, partner or another authorised person can provide access if that is easier for you.\n\nMake sure they know when the cleaner is expected and what they need to do.\n\nIf they are also responsible for locking up afterwards, that should be clear too.",
      },
      {
        question: "Does Mundoria keep customer keys?",
        answer:
          "No.\n\nMundoria does not routinely hold customer keys.\n\nAccess should be arranged through you being at home, a key safe, reception or concierge, an estate agent, a neighbour or another authorised person. The cleaner uses the access method you provide for that booking only.",
      },
      {
        question: "How are keys handled?",
        answer:
          "Keys should only be used for the purpose of completing the booking and should be handled according to the access instructions provided.\n\nIf a key is collected from reception, an estate agent or another authorised person, it should be returned as agreed.\n\nIf a customer uses a key safe, the key should be replaced and the property secured after the clean.\n\nThe key should never be labelled in a way that unnecessarily identifies the full address.",
      },
      {
        question: "What happens if a key is lost?",
        answer:
          "Tell Mundoria immediately.\n\nLosing a key can be a security issue. Mundoria will review where the key was collected, who had access to it and when it was last accounted for, and advise on the next steps.\n\nYou should also take any immediate security measures you need for the property, such as changing locks or codes where appropriate.",
      },
      {
        question: "Can I change my access instructions after booking?",
        answer:
          "Yes.\n\nIf the way the cleaner will enter the property changes, update the booking as soon as possible.\n\nThat might mean a new key safe code, a different reception desk, someone else providing access or a change in where the key is collected.\n\nThe earlier the information is updated, the less chance there is of the cleaner arriving with instructions that no longer work.",
      },
      {
        question: "What happens if the cleaner cannot gain access?",
        answer:
          "If the cleaner arrives and cannot get into the property, contact Mundoria as soon as possible.\n\nAfter check-in there is a 5-minute grace period, then a waiting charge of £0.50 per minute can apply. If access is sorted quickly, the clean may still go ahead. If it cannot be arranged, the booking may need to be shortened, rescheduled or cancelled depending on the remaining time and circumstances.",
      },
    ],
  },
  {
    id: "preferences",
    title: "Customer Preferences",
    description: "Saved preferences, products and accessibility notes.",
    items: [
      {
        question: "Can I save my cleaning preferences?",
        answer:
          "Yes.\n\nWhere the platform supports it, your preferences can stay connected to your account or recurring booking.\n\nThat can include priority rooms, products you prefer, pets, access instructions and areas that should not be entered.\n\nThe point is to reduce the need to explain the same things again every time.\n\nIf something changes, you should be able to update those preferences.",
      },
      {
        question: "Can I tell the cleaner how I like things done?",
        answer:
          "Yes.\n\nYou can include practical preferences about the cleaning as part of the booking.\n\nThat might mean which rooms matter most, how you want certain areas approached, which products you prefer or what should be avoided.\n\nThe cleaner should still use professional judgement where needed, especially if a requested method could damage a surface or create a safety issue.",
      },
      {
        question: "Can I choose which rooms are prioritised?",
        answer:
          "Yes.\n\nYou do not need to treat every room as equally important.\n\nIf the kitchen and bathrooms matter most, say so.\n\nIf you have guests coming and want the living areas prioritised, that is fine too.\n\nThe cleaner can use the booked time around the areas that matter most to you.",
      },
      {
        question: "Can I ask the cleaner to avoid certain areas?",
        answer:
          "Yes.\n\nIf there is a room, cupboard, workspace or part of the property you do not want entered or cleaned, make that clear in the booking.\n\nYou do not need to explain why.\n\nThe cleaner should respect the boundaries you have set.",
      },
      {
        question: "Can I request certain products?",
        answer:
          "Yes, where suitable.\n\nIf you prefer a particular type of product, you can provide it yourself or request an available alternative through Mundoria.\n\nThe product still needs to be appropriate for the surface being cleaned.\n\nIf something you request is not suitable, the cleaner should not use it simply because it was asked for.",
      },
      {
        question: "Can I request fragrance-free cleaning?",
        answer:
          "Yes, where suitable fragrance-free products are available.\n\nIf fragrance sensitivity matters to you, add that preference before the booking.\n\nYou can also provide your own products if you already have something you know works well for your household.",
      },
      {
        question: "Can I tell the cleaner about pets?",
        answer:
          "Yes, and you should.\n\nLet us know what kind of pets are in the home and whether there is anything important the cleaner needs to understand.\n\nThat might include keeping certain doors closed, making sure an animal does not escape, avoiding a particular area or knowing that a pet is nervous around unfamiliar people.\n\nIt is useful information, not an inconvenience.",
      },
      {
        question: "Can I add accessibility requirements?",
        answer:
          "Yes.\n\nIf there are access needs that affect how the booking should be handled, include them.\n\nThat may relate to entrances, lifts, mobility equipment, communication or how the cleaner moves around the property.\n\nThe more accurate the information is, the easier it is to arrange the booking properly.",
      },
      {
        question: "Can I add mobility considerations?",
        answer:
          "Yes.\n\nIf someone in the home has reduced mobility, uses mobility equipment or needs certain routes kept clear, include that information before the clean.\n\nThat helps the professional work around the household more thoughtfully.\n\nCleaning professionals do not provide physical assistance or personal care, but the cleaning itself can be arranged with the household's mobility needs in mind.",
      },
      {
        question: "Can I tell Mundoria that I work from home?",
        answer:
          "Yes.\n\nIf you work from home, it is useful to let us know.\n\nYou can mention which room you will be using, whether you have calls or meetings, and whether there are times when noisy tasks such as vacuuming would be inconvenient.\n\nWhere practical, the cleaner can plan the order of the work around that.",
      },
      {
        question: "Can I update my preferences later?",
        answer:
          "Yes.\n\nPreferences should not be frozen forever.\n\nIf your routine changes, you get a pet, you start working from home, you want a different product or a room should no longer be cleaned, update the information.\n\nThe whole point of saving preferences is to make future bookings easier, not to lock you into old instructions.",
      },
    ],
  },
  {
    id: "coverage",
    title: "Coverage",
    description: "Where Mundoria operates today and expansion plans.",
    items: [
      {
        question: "Which areas does Mundoria cover?",
        answer:
          "Mundoria is currently focused on Birmingham, with coverage developing across the wider West Midlands.\n\nThe exact areas available can change as the professional network grows.\n\nThe best way to check is by entering your postcode during booking.\n\nThat way, you see what is actually available rather than relying on a broad list that may become outdated.",
      },
      {
        question: "Does Mundoria cover all of Birmingham?",
        answer:
          "Mundoria is building coverage across Birmingham, but availability can still vary by postcode, service and time.\n\nA particular area may be covered for one type of booking but have limited availability for another.\n\nThat is why postcode checking is more reliable than simply saying every part of Birmingham is always available.",
      },
      {
        question: "Does Mundoria cover the wider West Midlands?",
        answer:
          "Coverage is expanding beyond Birmingham into the wider West Midlands.\n\nThe exact areas available depend on professional coverage and service capacity.\n\nIf your postcode is not currently available, that does not necessarily mean it will remain outside the service area permanently.",
      },
      {
        question: "How do I check whether Mundoria covers my postcode?",
        answer:
          "Enter your postcode during the booking journey.\n\nThe platform should tell you whether the service is currently available in your area and what booking options are open.\n\nThis is more accurate than a static coverage page because availability can change as the network grows.",
      },
      {
        question: "Can I book outside the current service area?",
        answer:
          "Not if the platform cannot currently support the location.\n\nWe would rather say an area is not available yet than accept a booking we cannot fulfil properly.\n\nAs coverage expands, more postcodes can be added.",
      },
      {
        question: "Will Mundoria expand to more UK cities?",
        answer:
          "Yes.\n\nBirmingham is the starting point.\n\nThe plan is to grow through the wider West Midlands and then into more UK locations over time.\n\nThe expansion needs to happen in a way that still allows Mundoria to maintain the professional onboarding, matching and support standards behind the service.\n\nGrowing quickly is useful.\n\nGrowing properly matters more.",
      },
      {
        question: "Does Mundoria operate nationwide?",
        answer:
          "Not currently.\n\nMundoria is starting in Birmingham and expanding from there.\n\nWe do not want to describe the service as nationwide before the professional network and booking coverage actually support that claim.\n\nWhen new areas become available, the coverage information should be updated accordingly.",
      },
      {
        question: "Can businesses with multiple locations use Mundoria?",
        answer:
          "Yes, where the locations fall within supported service areas.\n\nA business with several offices, retail units or other premises can arrange cleaning across more than one location.\n\nEach site still needs accurate details because different premises can have different layouts, access requirements, schedules and cleaning needs.\n\nAs Mundoria expands geographically, multi-location support can grow with it.",
      },
    ],
  },
  {
    id: "common",
    title: "Common Customer Questions",
    description: "First-time booking worries and practical expectations.",
    items: [
      {
        question: "Is it weird to have a cleaner?",
        answer:
          "Not at all.\n\nPeople use cleaning services for all sorts of reasons.\n\nSome are busy with work.\n\nSome have children.\n\nSome are recovering from something.\n\nSome simply do not enjoy cleaning.\n\nAnd some would rather spend their Saturday doing almost anything else.\n\nThere is no threshold you have to reach before you are \"allowed\" to ask someone else to clean your home.\n\nIf it makes life easier and it works for you, that is enough.",
      },
      {
        question: "Is hiring a cleaner lazy?",
        answer:
          "No.\n\nIt is a choice about how you use your time.\n\nMost people already pay other people to do things they could technically do themselves.\n\nWe eat in restaurants even though we have kitchens. We take taxis even though walking exists. We pay someone to cut our hair even though scissors are widely available.\n\nCleaning is no different.\n\nYou are not outsourcing responsibility for your life.\n\nYou are deciding which parts of it you want to spend your own time doing.",
      },
      {
        question: "Should I feel embarrassed if my home is messy?",
        answer:
          "No.\n\nYou do not need to present a perfect home to someone you have asked to clean it.\n\nHomes get messy.\n\nPeople get busy.\n\nLaundry piles up.\n\nBathrooms get ignored for longer than planned.\n\nThat is normal life.\n\nThe only useful preparation is making the areas you want cleaned reasonably accessible.\n\nThere is no prize for making the house look clean before the cleaner arrives.",
      },
      {
        question: "Will the cleaner judge my home?",
        answer:
          "They are there to clean it, not score it.\n\nCleaning professionals see different homes in different conditions.\n\nWhat matters is whether the booking accurately reflects the work and whether the property is safe to clean.\n\nIf there is significant build-up, say so.\n\nIf certain rooms are messy, that is fine.\n\nBeing honest about the condition helps us arrange the right amount of time.",
      },
      {
        question: "Do I have to clean before the cleaner arrives?",
        answer:
          "No.\n\nThat would rather defeat the point.\n\nYou do not need to scrub the bathroom, mop the floors or wipe down the kitchen before the cleaner arrives.\n\nIf you want to do anything, put away obvious clutter so the cleaner can reach the areas you actually want cleaned.\n\nCleaning before the cleaner comes is optional.\n\nAccess is useful.",
      },
      {
        question: "Can I ask the cleaner to focus only on certain rooms?",
        answer:
          "Yes.\n\nIf the kitchen and bathroom matter more than the rest of the home, say so.\n\nIf you want the living room ready for visitors and do not care about the spare bedroom this week, that is fine too.\n\nThe cleaner can focus on your priorities within the time booked.\n\nYour home does not need to follow somebody else's checklist.",
      },
      {
        question: "Can I stay home while the cleaner works?",
        answer:
          "Yes.\n\nYou can stay at home throughout the clean if that is what you prefer.\n\nIf you are working, relaxing or looking after children, just let the cleaner know if there are areas or times they should work around.\n\nYou do not need to disappear simply because somebody is cleaning.",
      },
      {
        question: "Can I leave the house while the cleaner works?",
        answer:
          "Yes.\n\nIf you are comfortable doing so and secure access has been arranged, you can leave while the clean takes place.\n\nMake sure the cleaner knows how to enter, what to prioritise and how the property should be secured when they leave.\n\nPut valuables and sensitive items somewhere safe before you go.\n\nThen get on with your day.",
      },
      {
        question: "How many hours of cleaning do I really need?",
        answer:
          "It depends on the home.\n\nThe number of bedrooms helps, but it does not tell the whole story.\n\nBathrooms, property size, condition, pets, children, the type of cleaning and what you want prioritised all affect the amount of time needed.\n\nA small flat needing a deep clean may need more time than a larger home that is already maintained regularly.\n\nThat is why Mundoria estimates the booking from the details you provide rather than relying on one fixed number for every property.",
      },
      {
        question: "Is weekly cleaning worth it?",
        answer:
          "For some households, absolutely.\n\nIf the home is busy, there are children or pets, you work from home or you simply notice that things start building up after a few days, weekly cleaning can keep everything at a comfortable level.\n\nThe value is not just that the home gets cleaned every week.\n\nIt is that cleaning stops becoming a large job you keep having to catch up on.\n\nIf your home stays comfortable for two weeks without much effort, weekly cleaning may be more than you need.",
      },
      {
        question: "Is fortnightly cleaning enough?",
        answer:
          "For many homes, yes.\n\nFortnightly cleaning can work especially well for smaller households, people who are out most of the day or homes where light tidying happens between visits.\n\nA simple test is to see how the home feels near the end of the second week.\n\nIf it still feels manageable, fortnightly may be the right rhythm.\n\nIf you are already wishing the cleaner had come several days earlier, weekly may suit you better.",
      },
      {
        question: "Should I start with a deep clean?",
        answer:
          "If your home has not had a thorough clean for some time, starting with a deep clean can make sense.\n\nIt gives more time to built-up grease, limescale, detailed bathroom and kitchen work, skirting boards and other areas that routine cleaning may not cover as deeply.\n\nOnce the home has been reset, regular cleaning can help keep it there.\n\nIf the property is already reasonably maintained, you may not need a deep clean first.",
      },
      {
        question: "What if I have never had a cleaner before?",
        answer:
          "That is completely fine.\n\nYou do not need to know exactly how everything works before making your first booking.\n\nStart with what you do know.\n\nTell us about the home, what you want help with and which areas matter most.\n\nYou can also add preferences, access details and anything you are unsure about.\n\nYou are not expected to become an expert in cleaning services before asking someone to clean your home.",
      },
      {
        question: "What should I expect at my first booking?",
        answer:
          "The professional should arrive at the agreed time, follow the access instructions and understand the service and priorities attached to the booking.\n\nIf you are home, you can point out anything important before they begin.\n\nIf you are not there, the booking instructions should contain what they need.\n\nThe cleaner then works through the agreed areas within the time booked.\n\nAfterwards, you should be able to see the booking as completed and provide feedback on the experience.\n\nThe first visit is also useful for learning what works for your home.\n\nYou may decide that the time estimate was right, that another room should be prioritised next time or that a different frequency would suit you better.\n\nThat is normal.",
      },
      {
        question: "Can I try Mundoria once before booking regularly?",
        answer:
          "Yes.\n\nYou can start with a one-off clean.\n\nThere is no need to commit to a weekly or fortnightly routine before you have even tried the service.\n\nIf the first booking works well and you decide that regular cleaning would make life easier, you can set up an ongoing schedule later.\n\nAnd if occasional one-off cleaning suits you better, that is fine too.\n\nMundoria should fit around your life, not ask you to reorganise it around Mundoria.",
      },
    ],
  },
];
export const FAQ_NAV_GROUPS: Array<{
  description: string;
  id: string;
  label: string;
  sectionIds: string[];
}> = [
  {
    id: "about",
    label: "About",
    description: "What Mundoria is and how it works.",
    sectionIds: ["about-mundoria"],
  },
  {
    id: "booking-group",
    label: "Booking",
    description: "Booking a clean and getting ready for the visit.",
    sectionIds: ["booking", "preparing"],
  },
  {
    id: "home-services",
    label: "Home",
    description: "Home, moving, short-let and recovery cleans.",
    sectionIds: [
      "regular-home",
      "deep-cleaning",
      "one-off",
      "apartment",
      "moving",
      "short-let",
      "recovery",
    ],
  },
  {
    id: "commercial",
    label: "Work",
    description: "Offices, retail, education and communal spaces.",
    sectionIds: ["office", "retail-hospitality", "educational", "communal"],
  },
  {
    id: "pricing-group",
    label: "Pricing",
    description: "Prices, products, equipment and payments.",
    sectionIds: ["products", "pricing", "payments"],
  },
  {
    id: "cleaners-trust",
    label: "Cleaners",
    description: "Professionals, matching and safety.",
    sectionIds: ["professionals", "matching", "safety"],
  },
  {
    id: "help-more",
    label: "More",
    description: "Changes, problems, access, coverage and common questions.",
    sectionIds: [
      "cancellations",
      "problems",
      "reviews",
      "recurring",
      "access",
      "preferences",
      "coverage",
      "common",
    ],
  },
];
