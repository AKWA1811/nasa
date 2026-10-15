# مشروع رصد النيازك والزلازل باستخدام Infrasound وSeismic
### ملف مرجعي لبناء Dataset وDatabase وموقع لمسابقة NASA Space Apps

## الفكرة الأساسية

منصة ويب تجمع إشارات **Infrasound** و**Seismic / Ground Vibration** من عدة أجهزة موزعة، ثم تحللها وتصنف الحدث كأحد الاحتمالات التالية:

- نيزك أو Fireball محتمل
- زلزال محتمل
- انفجار
- ضوضاء أو نشاط إنشائي
- حدث يحتاج مراجعة بشرية

النظام لا يقول إنه “يتنبأ بالزلازل”، بل يسجل الأحداث ويحللها ويحاول تحديد مصدرها أو مسارها التقريبي مع درجة ثقة وعدم يقين.

## لماذا هذه الفكرة قوية؟

النيزك الداخل للغلاف الجوي بسرعة تفوق الصوت يولّد موجة صدمية. هذه الموجة يمكن أن تظهر كـ Infrasound، وقد ينتقل جزء من طاقتها إلى الأرض فتسجلها أجهزة الزلازل.

لذلك، الجمع بين Infrasound وSeismic يساعد في:

- اكتشاف الأحداث الكبيرة في الغلاف الجوي.
- التمييز بين النيزك والزلزال والانفجار والضوضاء.
- تحديد الاتجاه أو الموقع التقريبي.
- إعادة بناء مسار Fireball عند توفر بيانات كافية.
- تقليل الإنذارات الخاطئة عبر التحقق من أكثر من حساس.

## الابتكار المقترح

لا يُقال إن الابتكار هو “استخدام Infrasound وSeismic لاكتشاف النيازك”، لأن هذا موجود في الأبحاث.

الابتكار الأفضل هو:

> منصة تجمع Infrasound وSeismic وبيانات الطقس والمشاهدات البصرية من شبكة موزعة، وتستخدم التحقق المتعدد والذكاء الاصطناعي لتمييز أحداث Fireball عن الزلازل والانفجارات والضوضاء، ثم تعرض موقعًا أو مسارًا تقريبيًا مع درجة ثقة وعدم يقين.

## الميزات المطلوبة في الموقع

### الصفحات الأساسية

| الصفحة | الوظيفة |
|---|---|
| الرئيسية | شرح مبسط للفكرة، خريطة الأحداث الحية، عدد الحساسات المتصلة |
| لوحة الحدث | waveform، spectrogram، وقت البدء، الشدة، الترددات، الاحتمالية، التصنيف |
| خريطة تفاعلية | مواقع الحساسات، اتجاه الموجة، منطقة المصدر، مسار النيزك المحتمل |
| سجل الأحداث | كل حدث مع وقته ومكانه وبياناته الخام ونتيجته |
| وضع Demo | توليد إشارة نيزك أو زلزال أو ضوضاء وشرح التحليل خطوة بخطوة |
| لوحة الباحثين | تحميل CSV أو JSON، فلترة الأحداث، عرض جودة البيانات |
| صفحة التحقق | تأكيد أو نفي الحدث بعد وقوعه لحساب دقة النظام وFalse Positives |

### الوظائف التقنية

- تسجيل Infrasound من مايكروفون أو حساس ضغط.
- تسجيل اهتزاز الأرض من accelerometer أو geophone أو seismometer.
- مزامنة الوقت بين الأجهزة باستخدام GPS أو NTP.
- فلترة الضوضاء مثل الرياح والمرور والإنشاءات.
- حساب FFT وspectrogram لتحليل الترددات.
- كشف التزامن بين أكثر من حساس.
- حساب الاتجاه التقريبي للموجة Back Azimuth.
- تقدير الموقع أو المسار مع Uncertainty.
- تصنيف الحدث باستخدام قواعد فيزيائية أولًا، ثم نموذج ML اختياري.
- تخزين كل الأحداث لتحليلها لاحقًا وتحسين النموذج.

## الجداول المطلوبة في Database

### users_devices

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| device_id | UUID / String | معرف فريد للجهاز |
| user_id | UUID / String | معرف المستخدم |
| device_type | String | هاتف، Raspberry Pi، حساس مخصص |
| sensor_types | JSON / Array | microphone، accelerometer، barometer، GPS |
| lat | Decimal | خط العرض |
| lon | Decimal | خط الطول |
| altitude | Decimal | الارتفاع |
| accuracy_m | Decimal | دقة الموقع بالمتر |
| os | String | نظام التشغيل |
| app_version | String | إصدار التطبيق |
| last_seen | Timestamp | آخر ظهور للجهاز |

### sensor_readings

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| reading_id | UUID / String | معرف القراءة |
| device_id | UUID / String | الجهاز الذي أرسل القراءة |
| timestamp_utc | Timestamp | وقت القراءة بتوقيت UTC |
| sensor_type | String | infrasound أو seismic أو pressure أو weather |
| value | Float | القيمة المقاسة |
| unit | String | Pa أو m/s2 أو hPa |
| sampling_rate_hz | Float | معدل أخذ العينات |
| quality_flag | String | good أو noisy أو suspicious |

### events

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| event_id | UUID / String | معرف الحدث |
| start_time_utc | Timestamp | بداية الحدث |
| end_time_utc | Timestamp | نهاية الحدث |
| event_type | String | meteor_candidate أو earthquake_candidate أو noise |
| confidence | Float | نسبة الثقة من 0 إلى 1 |
| status | String | pending أو confirmed أو rejected |
| region | String | المنطقة الجغرافية |
| created_at | Timestamp | وقت إنشاء السجل |

### event_detections

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| detection_id | UUID / String | معرف الكشف |
| event_id | UUID / String | الحدث المرتبط |
| device_id | UUID / String | الجهاز الذي رصد الحدث |
| arrival_time_utc | Timestamp | وقت وصول الإشارة |
| peak_amplitude | Float | أعلى شدة للإشارة |
| dominant_frequency_hz | Float | التردد الأبرز |
| duration_s | Float | مدة الإشارة بالثواني |
| snr | Float | نسبة الإشارة إلى الضوضاء |
| back_azimuth_deg | Float | اتجاه المصدر التقريبي |
| distance_km | Float | المسافة التقريبية إن أمكن |

### signal_features

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| event_id | UUID / String | الحدث المرتبط |
| device_id | UUID / String | الجهاز المرتبط |
| fft_peak_hz | Float | ذروة التردد بعد FFT |
| band_energy_0_1hz | Float | طاقة النطاق 0-1 Hz |
| band_energy_1_5hz | Float | طاقة النطاق 1-5 Hz |
| band_energy_5_20hz | Float | طاقة النطاق 5-20 Hz |
| n_wave_detected | Boolean | هل يوجد شكل N-wave؟ |
| spectral_centroid | Float | مركز الطيف الترددي |
| waveform_duration_s | Float | مدة الموجة |

### classifications

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| classification_id | UUID / String | معرف التصنيف |
| event_id | UUID / String | الحدث المرتبط |
| label | String | meteor أو earthquake أو explosion أو construction أو noise |
| probability | Float | احتمال التصنيف |
| model_version | String | إصدار النموذج |
| rules_triggered | JSON / Array | القواعد التي تحققت |
| explanation | Text | سبب التصنيف بلغة مبسطة |

### location_estimates

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| location_id | UUID / String | معرف التقدير |
| event_id | UUID / String | الحدث المرتبط |
| method | String | triangulation أو arrival-time أو waveform matching |
| lat | Decimal | خط العرض التقريبي |
| lon | Decimal | خط الطول التقريبي |
| altitude_km | Decimal | الارتفاع التقريبي |
| radius_km | Decimal | نصف قطر عدم اليقين |
| trajectory_start | JSON | بداية المسار المحتمل |
| trajectory_end | JSON | نهاية المسار المحتمل |
| uncertainty | JSON | مستوى عدم اليقين |

### weather_context

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| event_id | UUID / String | الحدث المرتبط |
| timestamp_utc | Timestamp | وقت البيانات الجوية |
| wind_speed | Float | سرعة الرياح |
| wind_direction | Float | اتجاه الرياح |
| temperature | Float | درجة الحرارة |
| pressure | Float | الضغط الجوي |
| precipitation | Float | الأمطار |
| source | String | مصدر البيانات الجوية |

### confirmations

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| confirmation_id | UUID / String | معرف التأكيد |
| event_id | UUID / String | الحدث المرتبط |
| source_type | String | user أو official أو camera أو satellite |
| confirmed_event | Boolean | هل تأكد الحدث؟ |
| notes | Text | ملاحظات |
| external_reference | String | رابط أو معرف مصدر خارجي |

### media_observations

| الحقل | النوع المقترح | الشرح |
|---|---|---|
| media_id | UUID / String | معرف الوسائط |
| event_id | UUID / String | الحدث المرتبط |
| url | String | رابط الفيديو أو الصورة |
| type | String | video أو photo أو audio |
| observed_time_utc | Timestamp | وقت المشاهدة |
| location | JSON | موقع المشاهد |
| contributor | String | اسم المستخدم أو معرفه |
| verified | Boolean | هل تم التحقق من الوسائط؟ |

## أنواع الإشارات

| الإشارة | الشرح البسيط | الأولوية |
|---|---|---|
| Infrasound | موجات ضغط منخفضة التردد لا يسمعها الإنسان، وترتبط بالنيزك والانفجارات | أساسية |
| Seismic / Ground Vibration | اهتزاز الأرض، وقد ينتج عن زلزال أو تحول طاقة الموجة الصوتية إلى اهتزاز | أساسية |
| P-waves | موجات زلزالية سريعة تصل أولًا | مهمة |
| S-waves | موجات زلزالية أبطأ وتسبب حركة قصية | مهمة |
| Rayleigh Waves | موجات سطحية بحركة شبه دائرية | لاحقًا |
| Love Waves | موجات سطحية أفقية | لاحقًا |
| Atmospheric Pressure | تغيرات الضغط الجوي | مفيدة |
| Weather Data | رياح وحرارة وضغط وأمطار | ضرورية |
| Optical / Camera | فيديو أو صورة Fireball | ممتازة كتأكيد |
| Satellite / Radar | بيانات مساعدة للتحقق | اختيارية |
| Electromagnetic Signals | تغيرات كهرومغناطيسية | بحثية فقط |

## كيف يفرق النظام بين الأحداث؟

### مؤشرات Fireball أو Meteor

- ظهور N-wave أو شكل موجي حاد يشبه الصدمة الجوية.
- طاقة مركزة في الترددات المنخفضة.
- غياب بداية واضحة لموجات P وS الزلزالية.
- مدة قصيرة نسبيًا للنبضة.
- وصول الإشارة إلى عدة حساسات بترتيب زمني يوافق مسارًا متحركًا في السماء.
- وجود فيديو أو صورة أو تقرير بشري عن Fireball يرفع الثقة كثيرًا.

### مؤشرات زلزال

- وصول P-wave ثم S-wave بترتيب واضح.
- انتشار أسرع بكثير من سرعة الصوت.
- توزيع زمني يتوافق مع مصدر تحت الأرض.
- احتمال ظهور موجات سطحية لاحقة.
- تأكيد من شبكة زلزالية رسمية مثل USGS أو EMSC.

### مؤشرات ضوضاء أو إنشاءات

- إشارة محلية في جهاز واحد فقط.
- تكرار في أوقات معينة مثل ساعات العمل أو حركة المرور.
- ترددات أو نمط غير متوافق مع انتشار موجة عبر مسافات بعيدة.
- تحسن سريع عند إزالة الجهاز أو تغيير مكانه.

## خوارزمية MVP بسيطة

1. يستقبل السيرفر مقطعًا من كل جهاز كل 5 إلى 10 ثوانٍ.
2. يزيل الضوضاء ويحسب peak amplitude وRMS وSNR وdominant frequency وspectrogram.
3. إذا تجاوزت الإشارة عتبة أولية، ينشئ candidate event.
4. يبحث عن أجهزة أخرى سجلت إشارة مشابهة خلال نافذة زمنية مناسبة.
5. يقارن شكل الموجة والترددات وزمن الوصول.
6. يحسب عدد الحساسات المتوافقة والاتجاه الظاهري والسرعة الظاهرية.
7. يعطي تصنيفًا مبدئيًا.
8. يعرض النتيجة كاحتمالية وليس كحقيقة مؤكدة.
9. بعد التأكيد أو النفي، يخزن النتيجة لتحسين النموذج.

## مثال على التصنيف

| الحالة | القرار المنطقي |
|---|---|
| infrasound قوي + إشارة أرضية متأخرة + عدة حساسات + لا توجد P/S واضحة | Meteor candidate |
| P-wave ثم S-wave + انتشار سريع + عدة محطات | Earthquake candidate |
| إشارة قوية في جهاز واحد + تكرار في نفس الوقت يوميًا | Noise أو Construction |
| infrasound قوي + تغير ضغط جوي + فيديو Fireball | Meteor event يحتاج تأكيدًا |
| إشارة غير واضحة + حساس واحد فقط | Needs review |

## مصادر علمية مهمة

- Sandia National Laboratories استخدمت Infrasound وSeismic وWeather Radar وفيديوهات المواطنين لإعادة بناء مسار Fireball وتحديد موقع التفكك ومنطقة الحطام المحتملة.
- دراسة Central Italy Bolide 2022 دمجت كاميرات all-sky و61 محطة زلزالية ومصفوفة Infrasound لتحليل الحدث.
- RedVox يثبت إمكانية تسجيل Infrasound من الهاتف.
- Earthquake Network يثبت إمكانية استخدام شبكة هواتف وaccelerometers لكشف الاهتزاز وإرسال تنبيهات.
- أبحاث سابقة أظهرت أن بعض الإشارات المنسوبة للنيازك قد تكون ضوضاء مرور أو noise خلفي، لذلك التحقق المتعدد ضروري.

## خطة MVP للمسابقة

1. صفحة ويب تستقبل بيانات من 3 أجهزة تجريبية على الأقل.
2. عرض waveform وspectrogram لكل جهاز.
3. كشف تلقائي للذروة وSNR والتردد المهيمن.
4. مقارنة زمن الوصول بين الأجهزة.
5. خريطة تعرض الحساسات والاتجاه التقريبي.
6. تصنيف أولي: Meteor candidate أو Earthquake candidate أو Noise أو Needs review.
7. زر تأكيد أو نفي الحدث لبناء dataset للتقييم.
8. Demo يولد fireball وearthquake وconstruction noise.

## صيغة العرض للجنة التحكيم

> منصتنا تربط Infrasound وSeismic وبيانات الطقس والمشاهدات البصرية من شبكة موزعة، وتستخدم التحقق المتعدد والذكاء الاصطناعي لتمييز أحداث Fireball عن الزلازل والانفجارات والضوضاء، ثم تعرض موقعًا أو مسارًا تقريبيًا مع درجة ثقة وعدم يقين.
