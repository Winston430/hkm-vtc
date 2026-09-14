import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'en' | 'sw'

type Entry = { en: string; sw: string }

// Every user-facing string lives here — never hardcode copy in components.
export const strings = {
  // ---- auth ----
  'login.welcome':            { en: 'Welcome back',                              sw: 'Karibu tena' },
  'login.subtitle':           { en: 'Sign in to manage your training centre.',   sw: 'Ingia kusimamia kituo chako cha mafunzo.' },
  'login.email':              { en: 'Email',                                     sw: 'Barua pepe' },
  'login.password':           { en: 'Password',                                  sw: 'Nywila' },
  'login.emailPlaceholder':   { en: 'you@hkmvtc.co.tz',                          sw: 'wewe@hkmvtc.co.tz' },
  'login.passwordPlaceholder':{ en: 'Enter your password',                       sw: 'Weka nywila yako' },
  'login.remember':           { en: 'Remember me',                               sw: 'Nikumbuke' },
  'login.forgot':             { en: 'Forgot password?',                          sw: 'Umesahau nywila?' },
  'login.signin':             { en: 'Sign in',                                   sw: 'Ingia' },
  'login.signingIn':          { en: 'Signing in…',                               sw: 'Inaingia…' },
  'login.note':               { en: 'Accounts are created by your administrator.', sw: 'Akaunti hutengenezwa na msimamizi wako.' },
  'login.contact':            { en: "Contact your admin if you can't sign in.",  sw: 'Wasiliana na msimamizi ikiwa huwezi kuingia.' },
  'login.error':              { en: 'Incorrect email or password.',              sw: 'Barua pepe au nywila si sahihi.' },
  'forgot.title':             { en: 'Reset your password',                       sw: 'Weka upya nywila yako' },
  'forgot.subtitle':          { en: "Enter your email and we'll send you a reset link.", sw: 'Weka barua pepe yako na tutakutumia kiungo cha kuweka upya.' },
  'forgot.send':              { en: 'Send reset link',                           sw: 'Tuma kiungo' },
  'forgot.back':              { en: 'Back to sign in',                           sw: 'Rudi kuingia' },
  'forgot.sentTitle':         { en: 'Check your email',                          sw: 'Angalia barua pepe yako' },
  'forgot.sentMsg':           { en: 'If an account exists for that address, a password reset link is on its way.', sw: 'Ikiwa akaunti ipo kwa anwani hiyo, kiungo cha kuweka upya nywila kinakuja.' },
  'forgot.error':             { en: "Couldn't send the reset email. Check the address and try again.", sw: 'Imeshindikana kutuma barua pepe. Angalia anwani na ujaribu tena.' },

  // ---- hero (auth right panel) ----
  'hero.eyebrow':             { en: 'Registered with NACTVET',                   sw: 'Imesajiliwa na NACTVET' },
  'hero.headline':            { en: 'Where skills become livelihoods.',          sw: 'Pale ujuzi unapokuwa kipato.' },
  'hero.sub':                 { en: 'Register and manage students across every branch — computer, beauty, driving, and more.', sw: 'Sajili na simamia wanafunzi katika kila tawi — kompyuta, urembo, udereva, na zaidi.' },
  'hero.courses':             { en: 'Courses offered',                           sw: 'Kozi zinazotolewa' },
  'hero.branches':            { en: 'Branches',                                  sw: 'Matawi' },
  'hero.students':            { en: 'Students trained',                          sw: 'Wanafunzi waliofunzwa' },

  // ---- sidebar nav ----
  'nav.dashboard':            { en: 'Dashboard',                                 sw: 'Dashibodi' },
  'nav.students':             { en: 'Students',                                  sw: 'Wanafunzi' },
  'nav.courses':              { en: 'Courses',                                   sw: 'Kozi' },
  'nav.branches':             { en: 'Branches',                                  sw: 'Matawi' },
  'nav.agents':               { en: 'Agents',                                    sw: 'Mawakala' },
  'nav.payments':             { en: 'Payments',                                  sw: 'Malipo' },
  'nav.menu':                 { en: 'Menu',                                      sw: 'Menyu' },
  'nav.signout':              { en: 'Sign out',                                  sw: 'Toka' },
  'nav.admin':                { en: 'Administrator',                             sw: 'Msimamizi' },
  'nav.allBranches':          { en: 'All branches',                             sw: 'Matawi yote' },

  // ---- dashboard ----
  'dash.greeting':            { en: 'Welcome back',                              sw: 'Karibu tena' },
  'dash.subtitle':            { en: "Here's what's happening across your training centre today.", sw: 'Haya ndiyo yanayoendelea katika kituo chako leo.' },
  'dash.totalStudents':       { en: 'Total students',                            sw: 'Wanafunzi wote' },
  'dash.feesCollected':       { en: 'Fees collected',                            sw: 'Ada zilizokusanywa' },
  'dash.outstanding':         { en: 'Outstanding balance',                       sw: 'Salio linalodaiwa' },
  'dash.allBranchesSub':      { en: 'across all branches',                       sw: 'matawi yote' },
  'dash.thisMonth':           { en: 'this month',                               sw: 'mwezi huu' },
  'dash.owedBy':              { en: 'across 63 students',                        sw: 'kwa wanafunzi 63' },
  'dash.recent':              { en: 'Recent registrations',                      sw: 'Usajili wa hivi karibuni' },
  'dash.viewAll':             { en: 'View all students',                         sw: 'Ona wote' },
  'dash.colStudent':          { en: 'Student',                                   sw: 'Mwanafunzi' },
  'dash.colBranch':           { en: 'Branch',                                    sw: 'Tawi' },
  'dash.colCourse':           { en: 'Course',                                    sw: 'Kozi' },
  'dash.colFees':             { en: 'Fees',                                      sw: 'Ada' },
  'dash.colStatus':           { en: 'Status',                                    sw: 'Hali' },
  'dash.paid':                { en: 'Paid',                                      sw: 'Imelipwa' },
  'dash.balanceDue':          { en: 'Balance due',                               sw: 'Salio linadaiwa' },
  'dash.popularCourses':      { en: 'Popular courses',                           sw: 'Kozi maarufu' },
  'dash.addCourse':           { en: 'Add course',                                sw: 'Ongeza kozi' },
  'dash.manage':              { en: 'Manage',                                    sw: 'Simamia' },
  'dash.enrolled':            { en: 'enrolled',                                  sw: 'wamejiandikisha' },
  'dash.studentsLower':       { en: 'students',                                  sw: 'wanafunzi' },
  'dash.mainCampus':          { en: 'Main campus',                               sw: 'Kampasi kuu' },
  'dash.agents':              { en: 'agents',                                    sw: 'mawakala' },
  'dash.addBranch':           { en: 'Add a new branch',                          sw: 'Ongeza tawi jipya' },
  'dash.notifications':       { en: 'Notifications',                             sw: 'Arifa' },
  'dash.notifSub':            { en: 'New students the moment they register',     sw: 'Wanafunzi wapya wanaposajiliwa' },
  'dash.todaysPayments':      { en: "Today's payments",                          sw: 'Malipo ya leo' },
  'dash.viewActivity':        { en: 'View all activity',                         sw: 'Ona shughuli zote' },
  'dash.fullCourse':          { en: 'Full course',                               sw: 'Kozi kamili' },
  'dash.installment':         { en: 'Installment',                               sw: 'Awamu' },

  // ---- register student ----
  'reg.title':                { en: 'Register student',                          sw: 'Sajili mwanafunzi' },
  'reg.subtitle':             { en: 'Fill in the applicant details, choose a course, and record the first payment.', sw: 'Jaza taarifa za mwombaji, chagua kozi, na weka malipo ya kwanza.' },
  'reg.section.personal':     { en: 'Applicant details',                         sw: 'Taarifa za mwombaji' },
  'reg.section.course':       { en: 'Course',                                    sw: 'Kozi' },
  'reg.section.payment':      { en: 'First payment',                             sw: 'Malipo ya kwanza' },
  'reg.fullName':             { en: 'Full name',                                 sw: 'Jina kamili' },
  'reg.gender':               { en: 'Gender',                                    sw: 'Jinsia' },
  'reg.male':                 { en: 'Male',                                      sw: 'Mwanaume' },
  'reg.female':               { en: 'Female',                                    sw: 'Mwanamke' },
  'reg.phone':                { en: 'Phone number',                              sw: 'Namba ya simu' },
  'reg.nida':                 { en: 'NIDA number (optional)',                    sw: 'Namba ya NIDA (hiari)' },
  'reg.tin':                  { en: 'TIN number (optional)',                     sw: 'Namba ya TIN (hiari)' },
  'reg.residence':            { en: 'Residence',                                 sw: 'Mahali anapoishi' },
  'reg.nok':                  { en: 'Next of kin',                               sw: 'Ndugu wa karibu' },
  'reg.nokName':              { en: 'Name',                                      sw: 'Jina' },
  'reg.nokRelationship':      { en: 'Relationship',                              sw: 'Uhusiano' },
  'reg.nokPhone':             { en: 'Phone',                                     sw: 'Simu' },
  'reg.photo':                { en: 'Passport photo',                            sw: 'Picha ya pasipoti' },
  'reg.photoHint':            { en: 'Tap to upload',                             sw: 'Gusa kupakia' },
  'reg.selectCourse':         { en: 'Select a course',                          sw: 'Chagua kozi' },
  'reg.branch':               { en: 'Branch',                                    sw: 'Tawi' },
  'reg.totalFee':             { en: 'Total fee',                                 sw: 'Ada yote' },
  'reg.amount':               { en: 'Amount paid',                               sw: 'Kiasi kilicholipwa' },
  'reg.period':               { en: 'Period covered',                           sw: 'Kipindi kilicholipiwa' },
  'reg.periodPlaceholder':    { en: 'e.g. 2 weeks, 1 month, full',              sw: 'mf. wiki 2, mwezi 1, kamili' },
  'reg.bankRef':              { en: 'Bank receipt number',                       sw: 'Namba ya risiti ya benki' },
  'reg.bankRefHint':          { en: 'No cash — payments go to the NMB account.', sw: 'Hakuna fedha taslimu — malipo huenda akaunti ya NMB.' },
  'reg.submit':               { en: 'Register student',                          sw: 'Sajili mwanafunzi' },
  'reg.success':              { en: 'Student registered',                        sw: 'Mwanafunzi amesajiliwa' },
  'reg.error':                { en: 'Could not register the student. Try again.',sw: 'Imeshindikana kusajili. Jaribu tena.' },
  'reg.balanceAfter':         { en: 'Balance after this payment',                sw: 'Salio baada ya malipo haya' },

  // ---- students list ----
  'students.title':           { en: 'Students',                                  sw: 'Wanafunzi' },
  'students.subtitle':        { en: 'Everyone registered so far.',               sw: 'Wote waliosajiliwa hadi sasa.' },
  'students.register':        { en: 'Register student',                          sw: 'Sajili mwanafunzi' },
  'students.empty':           { en: 'No students yet',                           sw: 'Hakuna wanafunzi bado' },
  'students.emptyHint':       { en: 'Register your first student to get started.', sw: 'Sajili mwanafunzi wako wa kwanza kuanza.' },
  'students.colReg':          { en: 'Reg. no.',                                  sw: 'Namba' },

  // ---- common ----
  'common.empty':             { en: 'Nothing here yet',                          sw: 'Hakuna kitu bado' },
  'common.seedTitle':         { en: 'Set up your catalog',                       sw: 'Anzisha katalogi yako' },
  'common.seedHint':          { en: 'Add the starter courses and branches from the HKM form to begin.', sw: 'Ongeza kozi na matawi ya awali kutoka fomu ya HKM kuanza.' },
  'common.seedBtn':           { en: 'Seed starter catalog',                      sw: 'Weka katalogi ya awali' },
  'common.cancel':            { en: 'Cancel',                                    sw: 'Ghairi' },

  // ---- register wizard ----
  'reg.step.personal':        { en: 'Personal info',                             sw: 'Taarifa binafsi' },
  'reg.step.course':          { en: 'Choose course',                             sw: 'Chagua kozi' },
  'reg.step.payment':         { en: 'Payment',                                   sw: 'Malipo' },
  'reg.step.confirm':         { en: 'Confirmation',                              sw: 'Uthibitisho' },
  'reg.next':                 { en: 'Continue',                                  sw: 'Endelea' },
  'reg.backStep':             { en: 'Back',                                      sw: 'Rudi' },
  'reg.stepLabel':            { en: 'Step',                                      sw: 'Hatua' },
  'reg.of':                   { en: 'of',                                        sw: 'kati ya' },
  'reg.reviewTitle':          { en: 'Review before registering',                 sw: 'Kagua kabla ya kusajili' },
  'reg.reviewHint':           { en: 'Check everything is correct — this creates the student record.', sw: 'Hakikisha kila kitu ni sahihi — hii inaunda rekodi ya mwanafunzi.' },
  'reg.regNoPreview':         { en: 'Registration number',                       sw: 'Namba ya usajili' },
  'reg.selectCoursePh':       { en: 'Select a course',                           sw: 'Chagua kozi' },
  'reg.selectBranchPh':       { en: 'Select a branch',                           sw: 'Chagua tawi' },
  'reg.genderPh':             { en: 'Select gender',                             sw: 'Chagua jinsia' },

  // ---- student detail ----
  'detail.back':              { en: 'Back to students',                          sw: 'Rudi kwa wanafunzi' },
  'detail.edit':              { en: 'Edit',                                      sw: 'Hariri' },
  'detail.save':              { en: 'Save changes',                              sw: 'Hifadhi mabadiliko' },
  'detail.cancel':            { en: 'Cancel',                                    sw: 'Ghairi' },
  'detail.saved':             { en: 'Changes saved',                             sw: 'Mabadiliko yamehifadhiwa' },
  'detail.saveError':         { en: 'Could not save. Try again.',                sw: 'Imeshindikana kuhifadhi. Jaribu tena.' },
  'detail.personal':          { en: 'Personal information',                      sw: 'Taarifa binafsi' },
  'detail.enrollment':        { en: 'Course & fees',                             sw: 'Kozi na ada' },
  'detail.paymentsTitle':     { en: 'Payment history',                           sw: 'Historia ya malipo' },
  'detail.totalDue':          { en: 'Total fee',                                 sw: 'Ada yote' },
  'detail.balance':           { en: 'Balance',                                   sw: 'Salio' },
  'detail.noPayments':        { en: 'No payments recorded yet',                  sw: 'Hakuna malipo bado' },
  'detail.notFound':          { en: 'Student not found',                         sw: 'Mwanafunzi hakupatikana' },

  // ---- installments ----
  'reg.installmentTitle':     { en: 'Installments',                              sw: 'Awamu za malipo' },
  'reg.installmentWord':      { en: 'Installment',                               sw: 'Awamu' },
  'reg.installmentsWord':     { en: 'Installments',                              sw: 'Awamu' },
  'reg.each':                 { en: 'each',                                      sw: 'kila moja' },
  'reg.twoWeeks':             { en: '2 weeks',                                   sw: 'wiki 2' },
  'reg.oneMonth':             { en: '1 month',                                   sw: 'mwezi 1' },
  'reg.chooseInstallment':    { en: 'Choose what to pay now',                    sw: 'Chagua cha kulipa sasa' },
  'reg.fullPayment':          { en: 'Full payment',                             sw: 'Malipo kamili' },
  'reg.amountNow':            { en: 'Amount to pay now',                         sw: 'Kiasi cha kulipa sasa' },
  'reg.planLine':             { en: 'This course is paid in',                    sw: 'Kozi hii hulipwa kwa' },

  // ---- drop / remove ----
  'detail.dangerZone':        { en: 'Danger zone',                               sw: 'Eneo la hatari' },
  'detail.drop':              { en: 'Mark as dropped',                           sw: 'Weka kama aliyeacha' },
  'detail.remove':            { en: 'Remove student',                            sw: 'Futa mwanafunzi' },
  'detail.dropped':           { en: 'Student marked as dropped',                 sw: 'Mwanafunzi amewekwa kama aliyeacha' },
  'detail.removed':           { en: 'Student removed',                           sw: 'Mwanafunzi amefutwa' },
  'detail.confirmDrop':       { en: 'Mark this student as dropped?',             sw: 'Weka mwanafunzi huyu kama aliyeacha?' },
  'detail.confirmRemove':     { en: 'Permanently remove this student and all their records? This cannot be undone.', sw: 'Futa kabisa mwanafunzi huyu na rekodi zake zote? Haiwezi kutenduliwa.' },
  'detail.confirm':           { en: 'Confirm',                                   sw: 'Thibitisha' },
  'detail.actionError':       { en: 'Action failed. Try again.',                 sw: 'Imeshindikana. Jaribu tena.' },
  'detail.statusDropped':     { en: 'Dropped',                                   sw: 'Aliacha' },

  // ---- record payment ----
  'detail.recordPayment':     { en: 'Record payment',                            sw: 'Weka malipo' },
  'detail.fullyPaid':         { en: 'Fully paid',                                sw: 'Imelipwa yote' },
  'detail.nextInstallment':   { en: 'Next installment',                          sw: 'Awamu inayofuata' },
  'detail.fullRemaining':     { en: 'Full remaining balance',                    sw: 'Salio lote lililobaki' },
  'detail.recordSuccess':     { en: 'Payment recorded',                          sw: 'Malipo yamewekwa' },
  'detail.recordError':       { en: 'Could not record payment. Try again.',      sw: 'Imeshindikana kuweka malipo. Jaribu tena.' },

  // ---- courses screen ----
  'courses.title':            { en: 'Courses',                                   sw: 'Kozi' },
  'courses.subtitle':         { en: 'Manage the course catalog and prices.',     sw: 'Simamia orodha ya kozi na bei.' },
  'courses.add':              { en: 'Add course',                                sw: 'Ongeza kozi' },
  'courses.edit':             { en: 'Edit course',                               sw: 'Hariri kozi' },
  'courses.name':             { en: 'Course name',                               sw: 'Jina la kozi' },
  'courses.code':             { en: 'Code',                                      sw: 'Msimbo' },
  'courses.codeHint':         { en: 'Used in registration numbers, e.g. DRV',    sw: 'Hutumika katika namba za usajili, mf. DRV' },
  'courses.category':         { en: 'Category',                                  sw: 'Jamii' },
  'courses.categoryPh':       { en: 'e.g. Computer, Beauty, Driving',            sw: 'mf. Kompyuta, Urembo, Udereva' },
  'courses.duration':         { en: 'Duration (months)',                         sw: 'Muda (miezi)' },
  'courses.price':            { en: 'Price (TSh)',                               sw: 'Bei (TSh)' },
  'courses.active':           { en: 'Active',                                    sw: 'Inatumika' },
  'courses.inactive':         { en: 'Inactive',                                  sw: 'Haitumiki' },
  'courses.save':             { en: 'Save course',                               sw: 'Hifadhi kozi' },
  'courses.saved':            { en: 'Course saved',                              sw: 'Kozi imehifadhiwa' },
  'courses.saveError':        { en: 'Could not save the course. Try again.',     sw: 'Imeshindikana kuhifadhi kozi. Jaribu tena.' },
  'courses.deleteTitle':      { en: 'Remove course',                             sw: 'Futa kozi' },
  'courses.deleteConfirm':    { en: 'Remove this course? Students already enrolled keep their records.', sw: 'Futa kozi hii? Wanafunzi waliojiandikisha watabaki na rekodi zao.' },
  'courses.deleted':          { en: 'Course removed',                            sw: 'Kozi imefutwa' },
  'courses.deleteError':      { en: 'Could not remove the course.',              sw: 'Imeshindikana kufuta kozi.' },
  'courses.empty':            { en: 'No courses yet',                            sw: 'Hakuna kozi bado' },
  'courses.emptyHint':        { en: 'Add your first course to the catalog.',     sw: 'Ongeza kozi yako ya kwanza.' },
  'courses.installments':     { en: 'Installments',                              sw: 'Awamu' },
  'courses.months':           { en: 'months',                                    sw: 'miezi' },
  'courses.month':            { en: 'month',                                     sw: 'mwezi' },

  // ---- branches screen ----
  'branches.title':           { en: 'Branches',                                  sw: 'Matawi' },
  'branches.subtitle':        { en: 'Manage your training centre locations.',    sw: 'Simamia maeneo ya kituo chako.' },
  'branches.add':             { en: 'Add branch',                                sw: 'Ongeza tawi' },
  'branches.edit':            { en: 'Edit branch',                               sw: 'Hariri tawi' },
  'branches.name':            { en: 'Branch name',                               sw: 'Jina la tawi' },
  'branches.location':        { en: 'Location',                                  sw: 'Mahali' },
  'branches.phone':           { en: 'Phone',                                     sw: 'Simu' },
  'branches.save':            { en: 'Save branch',                               sw: 'Hifadhi tawi' },
  'branches.saved':           { en: 'Branch saved',                              sw: 'Tawi limehifadhiwa' },
  'branches.saveError':       { en: 'Could not save the branch. Try again.',     sw: 'Imeshindikana kuhifadhi tawi. Jaribu tena.' },
  'branches.deleteTitle':     { en: 'Remove branch',                             sw: 'Futa tawi' },
  'branches.deleteConfirm':   { en: 'Remove this branch? Students already registered there keep their records.', sw: 'Futa tawi hili? Wanafunzi waliosajiliwa hapo watabaki na rekodi zao.' },
  'branches.deleted':         { en: 'Branch removed',                            sw: 'Tawi limefutwa' },
  'branches.deleteError':     { en: 'Could not remove the branch.',              sw: 'Imeshindikana kufuta tawi.' },
  'branches.empty':           { en: 'No branches yet',                           sw: 'Hakuna matawi bado' },
  'branches.emptyHint':       { en: 'Add your first branch to get started.',     sw: 'Ongeza tawi lako la kwanza kuanza.' },

  // ---- agents screen ----
  'agents.title':             { en: 'Agents',                                    sw: 'Mawakala' },
  'agents.subtitle':          { en: 'Create and manage front-desk staff accounts.', sw: 'Tengeneza na simamia akaunti za wafanyakazi.' },
  'agents.add':               { en: 'Add agent',                                 sw: 'Ongeza wakala' },
  'agents.name':              { en: 'Full name',                                 sw: 'Jina kamili' },
  'agents.email':             { en: 'Email',                                     sw: 'Barua pepe' },
  'agents.password':          { en: 'Temporary password',                        sw: 'Nywila ya muda' },
  'agents.passwordHint':      { en: 'Share it with the agent — they can reset it later.', sw: 'Mpe wakala — anaweza kuibadilisha baadaye.' },
  'agents.branch':            { en: 'Branch',                                    sw: 'Tawi' },
  'agents.branchPh':          { en: 'Assign a branch',                           sw: 'Panga tawi' },
  'agents.create':            { en: 'Create agent',                              sw: 'Tengeneza wakala' },
  'agents.created':           { en: 'Agent created',                             sw: 'Wakala ametengenezwa' },
  'agents.createError':       { en: 'Could not create the agent. The email may already be in use.', sw: 'Imeshindikana. Barua pepe huenda inatumika tayari.' },
  'agents.active':            { en: 'Active',                                    sw: 'Yupo kazini' },
  'agents.inactive':          { en: 'Disabled',                                 sw: 'Amezuiwa' },
  'agents.enable':            { en: 'Enable',                                    sw: 'Ruhusu' },
  'agents.disable':           { en: 'Disable',                                   sw: 'Zuia' },
  'agents.remove':            { en: 'Remove',                                    sw: 'Ondoa' },
  'agents.removeTitle':       { en: 'Remove agent',                              sw: 'Ondoa wakala' },
  'agents.removeConfirm':     { en: 'Remove this agent\'s access? They will no longer be able to use the app.', sw: 'Ondoa ufikiaji wa wakala huyu? Hataweza tena kutumia programu.' },
  'agents.removed':           { en: 'Agent removed',                             sw: 'Wakala ameondolewa' },
  'agents.actionError':       { en: 'Action failed. Try again.',                 sw: 'Imeshindikana. Jaribu tena.' },
  'agents.empty':             { en: 'No agents yet',                             sw: 'Hakuna mawakala bado' },
  'agents.emptyHint':         { en: 'Create an agent so they can register students at a branch.', sw: 'Tengeneza wakala ili asajili wanafunzi kwenye tawi.' },
  'agents.needBranch':        { en: 'Add a branch first, then create agents for it.', sw: 'Ongeza tawi kwanza, kisha tengeneza mawakala.' },

  // ---- students filter ----
  'students.all':             { en: 'All',                                       sw: 'Wote' },
  'students.owing':           { en: 'Owing',                                     sw: 'Wanaodaiwa' },
  'students.paidUp':          { en: 'Paid up',                                   sw: 'Waliomaliza' },
  'students.colBalance':      { en: 'Balance',                                   sw: 'Salio' },
  'students.colStatus':       { en: 'Status',                                    sw: 'Hali' },
  'students.noneOwing':       { en: 'No students owing — everyone is paid up.',  sw: 'Hakuna wanaodaiwa — wote wamemaliza.' },

  // ---- payments screen ----
  'payments.title':           { en: 'Payments',                                  sw: 'Malipo' },
  'payments.subtitle':        { en: 'All recorded installment payments.',        sw: 'Malipo yote ya awamu yaliyorekodiwa.' },
  'payments.collected':       { en: 'Collected',                                 sw: 'Zilizokusanywa' },
  'payments.count':           { en: 'Payments',                                  sw: 'Malipo' },
  'payments.todayCollected':  { en: 'Today',                                     sw: 'Leo' },
  'payments.all':             { en: 'All time',                                  sw: 'Muda wote' },
  'payments.today':           { en: 'Today',                                     sw: 'Leo' },
  'payments.week':            { en: 'This week',                                 sw: 'Wiki hii' },
  'payments.month':           { en: 'This month',                                sw: 'Mwezi huu' },
  'payments.search':          { en: 'Search name or receipt…',                   sw: 'Tafuta jina au risiti…' },
  'payments.allBranches':     { en: 'All branches',                              sw: 'Matawi yote' },
  'payments.export':          { en: 'Export CSV',                                sw: 'Pakua CSV' },
  'payments.colInstallment':  { en: 'Installment',                               sw: 'Awamu' },
  'payments.colReceipt':      { en: 'Receipt',                                   sw: 'Risiti' },
  'payments.colDate':         { en: 'Date',                                      sw: 'Tarehe' },
  'payments.colAmount':       { en: 'Amount',                                    sw: 'Kiasi' },
  'payments.empty':           { en: 'No payments yet',                           sw: 'Hakuna malipo bado' },
  'payments.emptyHint':       { en: 'Payments appear here as students pay.',     sw: 'Malipo yataonekana hapa wanafunzi wanapolipa.' },
  'payments.noResults':       { en: 'No payments match your filters.',           sw: 'Hakuna malipo yanayolingana.' },

  // ---- busy + errors ----
  'busy.registering':         { en: 'Registering student…',                      sw: 'Inasajili mwanafunzi…' },
  'busy.saving':              { en: 'Saving…',                                    sw: 'Inahifadhi…' },
  'busy.recording':           { en: 'Recording payment…',                        sw: 'Inaweka malipo…' },
  'busy.creating':            { en: 'Creating agent…',                            sw: 'Inatengeneza wakala…' },
  'busy.working':             { en: 'Working…',                                   sw: 'Inafanya kazi…' },
  'err.timeout':              { en: 'This is taking too long. Check your connection and try again.', sw: 'Imechukua muda mrefu. Angalia mtandao na ujaribu tena.' },
  'err.photo':                { en: "Couldn't upload the photo. Check that Firebase Storage is set up.", sw: 'Imeshindikana kupakia picha. Hakikisha Firebase Storage imewekwa.' },
  'err.missing':              { en: 'Please complete the required fields first.',  sw: 'Tafadhali jaza sehemu zinazohitajika kwanza.' },

  // ---- reports ----
  'nav.reports':              { en: 'Reports',                                   sw: 'Ripoti' },
  'reports.title':            { en: 'Reports',                                   sw: 'Ripoti' },
  'reports.subtitle':         { en: 'Print or save student and payment reports.', sw: 'Chapisha au hifadhi ripoti za wanafunzi na malipo.' },
  'reports.allStudents':      { en: 'All students',                              sw: 'Wanafunzi wote' },
  'reports.allStudentsDesc':  { en: 'Every registered student with their course and branch.', sw: 'Kila mwanafunzi aliyesajiliwa na kozi na tawi lake.' },
  'reports.outstanding':      { en: 'Outstanding balances',                      sw: 'Salio linalodaiwa' },
  'reports.outstandingDesc':  { en: 'Students still paying — amount paid and amount left.', sw: 'Wanafunzi wanaoendelea kulipa — kilicholipwa na kilichobaki.' },
  'reports.studentsCourses':  { en: 'Students & courses',                        sw: 'Wanafunzi na kozi' },
  'reports.studentsCoursesDesc': { en: 'Each student with the course they are enrolled in.', sw: 'Kila mwanafunzi na kozi aliyojiunga.' },
  'reports.print':            { en: 'Print',                                     sw: 'Chapisha' },
  'reports.count':            { en: 'students',                                  sw: 'wanafunzi' },
  'reports.popupBlocked':     { en: 'Allow pop-ups to print the report.',        sw: 'Ruhusu pop-ups ili kuchapisha ripoti.' },
  'reports.generated':        { en: 'Generated',                                 sw: 'Imetolewa' },
  'reports.countLabel':       { en: 'Count',                                     sw: 'Idadi' },
  'reports.totalLabel':       { en: 'TOTAL',                                     sw: 'JUMLA' },
  'reports.colNo':            { en: '#',                                         sw: '#' },
  'reports.colReg':           { en: 'Reg. No.',                                  sw: 'Namba' },
  'reports.colName':          { en: 'Name',                                      sw: 'Jina' },
  'reports.colGender':        { en: 'Gender',                                    sw: 'Jinsia' },
  'reports.colPhone':         { en: 'Phone',                                     sw: 'Simu' },
  'reports.colBranch':        { en: 'Branch',                                    sw: 'Tawi' },
  'reports.colCourse':        { en: 'Course',                                    sw: 'Kozi' },
  'reports.colTotal':         { en: 'Total fee',                                 sw: 'Ada yote' },
  'reports.colPaid':          { en: 'Paid',                                      sw: 'Kilicholipwa' },
  'reports.colBalance':       { en: 'Balance',                                   sw: 'Salio' },
  'reports.colStatus':        { en: 'Status',                                    sw: 'Hali' },
  'reports.statusPaid':       { en: 'Paid',                                      sw: 'Imelipwa' },
  'reports.statusOwing':      { en: 'Owing',                                     sw: 'Anadaiwa' },
  'reports.statusDropped':    { en: 'Dropped',                                   sw: 'Aliacha' },

  // ---- greetings ----
  'greeting.morning':         { en: 'Good morning',                              sw: 'Habari za asubuhi' },
  'greeting.afternoon':       { en: 'Good afternoon',                            sw: 'Habari za mchana' },
  'greeting.evening':         { en: 'Good evening',                              sw: 'Habari za jioni' },

  // ---- settings ----
  'nav.settings':             { en: 'Settings',                                  sw: 'Mipangilio' },
  'settings.title':           { en: 'Settings',                                  sw: 'Mipangilio' },
  'settings.subtitle':        { en: 'Your profile, language and security.',      sw: 'Wasifu wako, lugha na usalama.' },
  'settings.profile':         { en: 'Profile',                                   sw: 'Wasifu' },
  'settings.name':            { en: 'Name',                                      sw: 'Jina' },
  'settings.email':           { en: 'Email',                                     sw: 'Barua pepe' },
  'settings.role':            { en: 'Role',                                      sw: 'Wadhifa' },
  'settings.branch':          { en: 'Branch',                                    sw: 'Tawi' },
  'settings.roleAdmin':       { en: 'Administrator',                             sw: 'Msimamizi' },
  'settings.roleAgent':       { en: 'Agent',                                     sw: 'Wakala' },
  'settings.allBranches':     { en: 'All branches',                              sw: 'Matawi yote' },
  'settings.nameSaved':       { en: 'Name updated',                              sw: 'Jina limebadilishwa' },
  'settings.nameError':       { en: "Couldn't update your name.",                sw: 'Imeshindikana kubadilisha jina.' },
  'settings.language':        { en: 'Language',                                  sw: 'Lugha' },
  'settings.languageDesc':    { en: 'Choose the language used across the app.',  sw: 'Chagua lugha inayotumika katika programu.' },
  'settings.security':        { en: 'Security',                                  sw: 'Usalama' },
  'settings.newPassword':     { en: 'New password',                              sw: 'Nywila mpya' },
  'settings.confirmPassword': { en: 'Confirm password',                          sw: 'Thibitisha nywila' },
  'settings.changePassword':  { en: 'Change password',                           sw: 'Badilisha nywila' },
  'settings.passwordChanged': { en: 'Password changed',                          sw: 'Nywila imebadilishwa' },
  'settings.passwordError':   { en: 'Could not change the password.',            sw: 'Imeshindikana kubadilisha nywila.' },
  'settings.passwordMismatch':{ en: 'Passwords do not match.',                   sw: 'Nywila hazifanani.' },
  'settings.passwordShort':   { en: 'Use at least 6 characters.',                sw: 'Tumia angalau herufi 6.' },
  'settings.reauth':          { en: 'For security, sign out and back in, then change your password.', sw: 'Kwa usalama, toka na uingie tena, kisha badilisha nywila.' },
  'settings.orReset':         { en: 'Or email me a reset link instead',          sw: 'Au nitumie kiungo cha kuweka upya' },
  'settings.resetSent':       { en: 'Reset link sent to your email.',            sw: 'Kiungo cha kuweka upya kimetumwa.' },
  'settings.resetError':      { en: 'Could not send the reset link.',            sw: 'Imeshindikana kutuma kiungo.' },

  // ---- students search + ended filter ----
  'students.searchPh':        { en: 'Search name or reg no…',                    sw: 'Tafuta jina au namba…' },
  'students.ended':           { en: 'Ended',                                     sw: 'Imeisha' },
  'students.endedNone':       { en: 'No courses have ended yet.',                sw: 'Hakuna kozi zilizoisha bado.' },
  'students.noResults':       { en: 'No students match your search.',            sw: 'Hakuna wanafunzi wanaolingana.' },
  'students.courseEnded':     { en: 'Course ended',                              sw: 'Kozi imeisha' },

  // ---- payment receipt ----
  'receipt.print':            { en: 'Receipt',                                   sw: 'Risiti' },
  'receipt.title':            { en: 'PAYMENT RECEIPT',                           sw: 'RISITI YA MALIPO' },
  'receipt.no':               { en: 'Receipt No.',                               sw: 'Namba ya Risiti' },
  'receipt.date':             { en: 'Date',                                      sw: 'Tarehe' },
  'receipt.student':          { en: 'Student',                                   sw: 'Mwanafunzi' },
  'receipt.reg':              { en: 'Reg. No.',                                  sw: 'Namba ya Usajili' },
  'receipt.course':           { en: 'Course',                                    sw: 'Kozi' },
  'receipt.amount':           { en: 'Amount paid',                               sw: 'Kiasi kilicholipwa' },
  'receipt.for':              { en: 'For',                                       sw: 'Kwa ajili ya' },
  'receipt.balance':          { en: 'Balance remaining',                         sw: 'Salio lililobaki' },
  'receipt.received':         { en: 'Received by',                               sw: 'Imepokelewa na' },
  'receipt.thanks':           { en: 'Thank you.',                                sw: 'Asante.' },

  // ---- offline ----
  'offline.message':          { en: "You're offline — changes won't save until you reconnect.", sw: 'Hauko mtandaoni — mabadiliko hayatahifadhiwa hadi urejee.' },

  // ---- appearance (dark mode) ----
  'settings.appearance':      { en: 'Appearance',                                sw: 'Muonekano' },
  'settings.appearanceDesc':  { en: 'Light, dark, or match your device.',        sw: 'Mwangaza, giza, au fuata kifaa chako.' },
  'settings.themeLight':      { en: 'Light',                                     sw: 'Mwangaza' },
  'settings.themeDark':       { en: 'Dark',                                      sw: 'Giza' },
  'settings.themeSystem':     { en: 'System',                                    sw: 'Kifaa' },

  // ---- sound + install (PWA) ----
  'settings.sound':           { en: 'Notification sound',                        sw: 'Sauti ya arifa' },
  'settings.soundDesc':       { en: 'Play a short sound with notifications.',     sw: 'Piga sauti fupi na arifa.' },
  'settings.install':         { en: 'Install app',                               sw: 'Sakinisha programu' },
  'settings.installDesc':     { en: 'Install HKM VTC on this device for quick, full-screen access.', sw: 'Sakinisha HKM VTC kwenye kifaa hiki kwa ufikiaji wa haraka.' },
  'settings.installBtn':      { en: 'Install',                                   sw: 'Sakinisha' },
  'settings.installed':       { en: 'The app is installed on this device.',      sw: 'Programu imesakinishwa kwenye kifaa hiki.' },
  'settings.installHint':     { en: 'Not available here — use your browser menu (Install app / Add to Home screen).', sw: 'Haipatikani hapa — tumia menyu ya kivinjari (Install app / Add to Home screen).' },
} satisfies Record<string, Entry>

export type StringKey = keyof typeof strings

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey) => string
}

const I18nContext = createContext<I18nValue | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('hkm.lang') as Lang) || 'en'
  )

  useEffect(() => {
    localStorage.setItem('hkm.lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = (key: StringKey) => strings[key]?.[lang] ?? String(key)

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}