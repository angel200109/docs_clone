# 閸楀繐鎮撶紓鏍帆娑撳孩鏋冨锝囬獓 RBAC 閺傝顢?
## 閻╊喗鐖?
閸︺劌缍嬮崜?`Next.js + Clerk + Convex + TipTap` 妞ゅ湱娲版稉濠冨⒖鐏炴洖顦挎禍鍝勫礂閸氬瞼绱潏鎴ｅ厴閸旀冻绱濋獮璺虹杽閻滅増鏋冨锝囬獓閺夊啴妾洪幒褍鍩楅敍?
- `owner`閿涙艾褰茬拠姹団偓浣稿讲閸愭瑣鈧礁褰查崚鍡曢煩閵嗕礁褰茬粻锛勬倞閹存劕鎲抽妴浣稿讲閸掔娀娅庨弬鍥ㄣ€?- `editor`閿涙艾褰茬拠姹団偓浣稿讲閸?- `viewer`閿涙艾褰х拠?
娑撳秷绺肩粔璇插煂 Supabase閿涘瞼鎴风紒顓濆▏閻㈩煉绱?
- `Clerk`閿涙俺闊╂禒鍊燁吇鐠?- `Convex`閿涙矮绗熼崝鈩冩殶閹诡喓鈧焦鏋冨锝嗗灇閸涙ê鍙х化姹団偓浣规綀闂勬劖鐗庢?- `Hocuspocus + Yjs`閿涙艾鐤勯弮璺哄礂閸氬瞼绱潏?
## 瑜版挸澧犻悩鑸碘偓?
瑜版挸澧犵€圭偟骞囬弰顖氬礋閻劍鍩涚紓鏍帆濡€崇础閿?
- 閺傚洦銆傛稉鏄忋€冮崣顏呮箒 `documents`
- 閺傚洦銆傞崘鍛啇娣囨繂鐡ㄩ崷?`documents.documentContent`
- 缂傛牞绶崳銊︾槨濞嗏剝娲块弬鏉挎倵闁俺绻?`api.documents.updateContentById` 閸ョ偛鍟?HTML
- 鐠佸潡妫堕幒褍鍩楅惄顔煎閸欘亝婀侀垾婊勬Ц閸氾缚璐?owner閳?
閻╃鍙ч弬鍥︽閿?
- [convex/schema.ts](d:/Code/Frontend/docs-clone/convex/schema.ts)
- [convex/documents.ts](d:/Code/Frontend/docs-clone/convex/documents.ts)
- [src/app/documents/[documentId]/editor.tsx](d:/Code/Frontend/docs-clone/src/app/documents/[documentId]/editor.tsx)
- [src/app/documents/[documentId]/page.tsx](d:/Code/Frontend/docs-clone/src/app/documents/[documentId]/page.tsx)

## 閹缍嬮弸鑸电€?
```text
Clerk
  -> 閹绘劒绶甸惂璇茬秿閹椒绗?userId

Convex
  -> 娣囨繂鐡?documents
  -> 娣囨繂鐡?documentMembers
  -> 閹绘劒绶甸弬鍥ㄣ€傜痪?RBAC 閸掋倕鐣?  -> 閹绘劒绶甸崚鍡曢煩/闁偓鐠?閺€纭咁潡閼瑰弶甯撮崣?
Hocuspocus
  -> 閹恒儱鍙?Yjs 閺傚洦銆傞崥灞绢劄
  -> 鏉╃偞甯撮柎瀛樻綀
  -> 閺嶈宓佺憴鎺曞閸愬啿鐣鹃崣顖氬晸閹存牕褰х拠?  -> 閹镐椒绠欓崠鏍у礂閸氬本鏋冨锝囧Ц閹?
TipTap
  -> 闁俺绻?Collaboration 閹碘晛鐫嶉幒銉ュ弳 Yjs
  -> 鐏炴洜銇氬锝嗘瀮閵嗕浇绻欑粙瀣帨閺嶅洢鈧礁婀痪鍨礂娴ｆ粏鈧?```

## 閺佺増宓佸Ο鈥崇€?
### 1. documents

娣囨繄鏆€閻滅増婀佺悰顭掔礉楠炴儼藟閸忓懎宕楅崥灞芥嫲閸掑棔闊╅惄绋垮彠鐎涙顔岄妴?
瀵ら缚顔呯紒鎾寸€敍?
```ts
documents: defineTable({
  title: v.string(),
  ownerId: v.string(),
  documentContent: v.optional(v.string()),
  leftMargin: v.optional(v.float64()),
  rightMargin: v.optional(v.float64()),

  // 閸欘垶鈧绱伴悽銊ょ艾閸楀繐鎮撻幐浣风畽閸栨牜娈戣箛顐ゅ弾閹存牕鍘撻弫鐗堝祦
  collaborationRoomId: v.optional(v.string()),
  lastOpenedAt: v.optional(v.number()),
})
  .index("by_owner_id", ["ownerId"])
  .searchIndex("search_title", {
    searchField: "title",
    filterFields: ["ownerId"],
  })
```

鐠囧瓨妲戦敍?
- `documentContent` 閻厽婀＄紒褏鐢绘穱婵堟殌閿涘奔绌舵禍搴″悑鐎瑰湱骞囬張澶嬭閺屾挸鎷版潻浣盒╅張鐔锋礀闁偓
- 闂€鎸庢埂娑撳秴绨查崘宥嗗Ω鐎瑰啫缍嬮幋鎰樋娴滆櫣绱潏鎴犳畱閸烆垯绔撮惇鐔风杽閺夈儲绨?- 閸楀繐鎮撻惇鐔风杽閺夈儲绨惔鏃囨祮閸?`Yjs document`

### 2. documentMembers

閺傛澘顤冮弬鍥ㄣ€傞幋鎰喅閸忓磭閮寸悰顭掔礉鐞涖劏鎻挧鍕爱缁狙勬綀闂勬劑鈧?
瀵ら缚顔呯紒鎾寸€敍?
```ts
documentMembers: defineTable({
  documentId: v.id("documents"),
  userId: v.string(),
  role: v.union(
    v.literal("owner"),
    v.literal("editor"),
    v.literal("viewer"),
  ),
  invitedBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_document_id", ["documentId"])
  .index("by_user_id", ["userId"])
  .index("by_document_and_user", ["documentId", "userId"])
```

鐟欏嫬鍨敍?
- 濮ｅ繋閲滈弬鍥ㄣ€傞崣顏呮箒娑撯偓娑?`owner`
- `owner` 閸氬本妞傞棁鈧憰浣告躬 `documents.ownerId` 閸?`documentMembers` 娑擃厺绻氶幐浣风閼?- 閺傛澘缂撻弬鍥ㄣ€傞弮鎯板殰閸斻劍褰冮崗銉ょ閺?`owner` 閹存劕鎲崇拋鏉跨秿

## 閺夊啴妾哄Ο鈥崇€?
### 閺傚洦銆傞弶鍐閻晠妯€

| 閸斻劋缍?| owner | editor | viewer |
|---|---|---|---|
| 閺屻儳婀呴弬鍥ㄣ€?| 閺?| 閺?| 閺?|
| 鏉╂稑鍙嗛崡蹇撴倱閹村潡妫?| 閺?| 閺?| 閺?|
| 缂傛牞绶锝嗘瀮 | 閺?| 閺?| 閸?|
| 娣囶喗鏁奸弽鍥暯 | 閺?| 閺?| 閸?|
| 娣囶喗鏁兼潏纭呯獩 | 閺?| 閺?| 閸?|
| 閸掑棔闊╅弬鍥ㄣ€?| 閺?| 閸?| 閸?|
| 娣囶喗鏁奸幋鎰喅鐟欐帟澹?| 閺?| 閸?| 閸?|
| 缁夊娅庨幋鎰喅 | 閺?| 閸?| 閸?|
| 閸掔娀娅庨弬鍥ㄣ€?| 閺?| 閸?| 閸?|
| 鏉烆剛些 owner | 閺?| 閸?| 閸?|

### 閺夊啴妾洪崚銈呯暰閸樼喎鍨?
- 閹碘偓閺?Convex query/mutation 闁棄绻€妞よ婀張宥呭缁旑垶鍣搁弬鐗堢墡妤犲矁顫楅懝?- 閸撳秶顏幐澶愭尦闂呮劘妫岄崣顏呮Ц娴ｆ捇鐛欐导妯哄閿涘奔绗夐懗鎴掔稊娑撶儤娼堥梽鎰贩閹?- Hocuspocus 鏉╃偞甯撮弮鏈电瘍韫囧懘銆忛崘宥嗩偧閺嶏繝鐛欓敍灞肩瑝閼宠棄褰ф穱鈥叉崲閸撳秶顏导鐘插棘

## Convex 鐏炲倽顔曠拋?
### 閺傛澘顤冮柅姘辨暏閹哄牊娼堥崙鑺ユ殶

瀵ら缚顔呴幎钘夊毉閸愬懘鍎村銉ュ徔閿涘奔绶ユ俊鍌︾窗

```ts
type DocumentRole = "owner" | "editor" | "viewer";

async function getCurrentUserIdOrThrow(ctx): Promise<string>
async function getDocumentRole(ctx, documentId, userId): Promise<DocumentRole | null>
async function requireDocumentRole(ctx, documentId, roles: DocumentRole[]): Promise<DocumentRole>
async function requireDocumentOwner(ctx, documentId): Promise<void>
```

瀵ら缚顔呴弨鍓х枂娴ｅ秶鐤嗛敍?
- `convex/lib/auth.ts`
- 閹?`convex/documents.ts` 閸愬懘鍎撮崗鍫濈杽閻滃府绱濋崥搴ｇ敾閸愬秵濞婄粋?
### 閻滅増婀侀幒銉ュ經閺€褰掆偓鐘茬紦鐠?
#### `documents.getById`

瑜版挸澧犻梻顕€顣介敍?
- 娴犺缍嶉幏鍨煂閺傚洦銆?ID 閻ㄥ嫬鍑￠惂璇茬秿閻劍鍩涢柈鍊熷厴鐠囪褰囬弬鍥ㄣ€?
閺€褰掆偓鐘垫窗閺嶅浄绱?
- 閸欘亝婀?`owner/editor/viewer` 閸欘垯浜掔拠璇插絿

#### `documents.updateContentById`

瑜版挸澧犻梻顕€顣介敍?
- 閸欘亝鐗庢?`ownerId`

閺€褰掆偓鐘垫窗閺嶅浄绱?
- 閸忎浇顔?`owner/editor`
- 缁備焦顒?`viewer`
- 閸︺劌鍨忛幑銏犲煂 Yjs 閸氬函绱濈拠銉﹀复閸欙絽褰ф穱婵堟殌娑撳搫鎻╅悡褑鎯ら惄妯诲灗鏉╀胶些閸忕厧顔愰幒銉ュ經

#### `documents.renameById`

閺€褰掆偓鐘垫窗閺嶅浄绱?
- 閸忎浇顔?`owner/editor`

#### `documents.updateMargins`

閺€褰掆偓鐘垫窗閺嶅浄绱?
- 閸忎浇顔?`owner/editor`

#### `documents.removeById`

閺€褰掆偓鐘垫窗閺嶅浄绱?
- 娴?`owner`

### 閺傛澘顤冮幒銉ュ經

瀵ら缚顔呴弬鏉款杻閿?
- `documents.getAccessById`
  - 鏉╂柨娲栬ぐ鎾冲閻劍鍩涚€佃鏋冨锝囨畱鐟欐帟澹婇崪灞藉讲閹笛嗩攽閸斻劋缍?- `documentMembers.listByDocument`
  - 閼惧嘲褰囬幋鎰喅閸掓銆?- `documentMembers.inviteOrUpsert`
  - owner 濞ｈ濮為幋鎰喅閹存牔鎱ㄩ弨纭咁潡閼?- `documentMembers.remove`
  - owner 缁夊娅庨幋鎰喅
- `documentMembers.transferOwnership`
  - owner 鏉烆剛些閹碘偓閺堝娼?
## Hocuspocus 閹恒儱鍙嗙拋鎹愵吀

### 閻╊喗鐖?
- 娑撯偓娑擃亝鏋冨锝咁嚠鎼存柧绔存稉顏勫礂閸?room
- 鏉╃偞甯撮弮璺虹唨娴?`Clerk + Convex` 闁村瓨娼?- `viewer` 娴ｈ法鏁ら崣顏囶嚢鏉╃偞甯?- 閺€顖涘瘮閹镐椒绠欓崠?
### 瀵ら缚顔呮潻鐐村复濞翠胶鈻?
```text
1. 閻劍鍩涢柅姘崇箖 Clerk 閻ц缍?2. 閸撳秶顏拠閿嬬湴 Convex 閼惧嘲褰囪ぐ鎾冲閻劍鍩涚€?document 閻ㄥ嫯顫楅懝?3. 閸撳秶顏崥鎴濈安閻劌鎮楃粩顖濐嚞濮瑰倷绔存稉顏嗙叚閺?collaboration token
4. Hocuspocus 閸?onAuthenticate 娑擃厽鐗庢?token
5. Hocuspocus 閺屻儴顕楃拠銉ф暏閹村嘲顕拠?document 閻ㄥ嫯顫楅懝?6. owner/editor -> 閸欘垰鍟?7. viewer -> readOnly
8. 閺冪姵娼堥梽?-> 閹锋帞绮锋潻鐐村复
```

### Token 鐠佹崘顓稿楦款唴

token 閸愬懓鍤︾亸鎴濆瘶閸氼偓绱?
- `userId`
- `documentId`
- `exp`

濞夈劍鍓伴敍?
- 娑撳秴缂撶拋顔煎缁旑垳娲块幒銉﹀Ω `role` 娴肩姷绮?Hocuspocus 楠炴湹淇婃禒璇茬暊
- `role` 鎼存柨婀?Hocuspocus 閺堝秴濮熺粩顖氬晙濞嗏剝鐓＄拠銏⑩€樼拋?
### 閹镐椒绠欓崠鏍摜閻?
閸掓繃婀″楦款唴閿?
- Hocuspocus 閹镐椒绠欓崠?Yjs 閺傚洦銆傞悩鑸碘偓?- 鐎规碍妞傞幋鏍ф躬閺傚洦銆傜粚娲＝閺冭泛鎮撳銉ュ毉 HTML 韫囶偆鍙庨崚?`documents.documentContent`

閸樼喎娲滈敍?
- 閸忕厧顔愰悳鐗堟箒妞ょ敻娼扮拠璇插絿闁槒绶?- 闂勫秳缍嗘禒?HTML 鐎涙ê鍋嶉崚鍥у煂 Yjs 閻ㄥ嫯绺肩粔濠氼棑闂?
## 閸撳秶顏弨褰掆偓鐘虹熅瀵?
### 缁楊兛绔撮梼鑸殿唽閿涙艾鍘涢拃?RBAC閿涘奔绗夋稉濠傚礂閸?
閻╊喗鐖ｉ敍?
- 娣囨繃瀵旈悳鐗堟箒 HTML 鐎涙ê鍋嶅Ο鈥崇础
- 閸忓牊濡搁弬鍥ㄣ€傞幋鎰喅閸忓磭閮撮崪灞炬綀闂勬劖膩閸ㄥ澧﹂柅?
閺€鐟板З閿?
- 閹碘晛鐫?`schema.ts`
- 閺€褰掆偓?`documents.ts` 閹哄牊娼堥柅鏄忕帆
- 閸︺劍鏋冨锝夈€夌拠璇插絿瑜版挸澧犵憴鎺曞
- 閹稿顫楅懝鑼洣閻劎绱潏鎴濇珤閸滃本鎼锋担婊勫瘻闁?
### 缁楊兛绨╅梼鑸殿唽閿涙碍甯撮崗?Yjs + Hocuspocus

閻╊喗鐖ｉ敍?
- 鐠佲晜顒滈弬鍥︾矤閳ユ粌鐣鹃弮鏈电箽鐎?HTML閳ユ繂鍨忛幑銏犲煂閳ユ返js 閸楀繐鎮撻崥灞绢劄閳?
閺€鐟板З閿?
- `editor.tsx` 娴ｈ法鏁?`@tiptap/extension-collaboration`
- 閺傛澘顤?provider 閸掓繂顫愰崠鏍偓鏄忕帆
- viewer 鏉╂稑鍙嗛崣顏囶嚢濡€崇础
- editor/owner 閸欘垰鍟?
### 缁楊兛绗侀梼鑸殿唽閿涙艾鍨庢禍顐＄瑢閹存劕鎲崇粻锛勬倞 UI

閻╊喗鐖ｉ敍?
- owner 閸欘垱鍧婇崝?editor/viewer
- owner 閸欘垵鐨熼弫纾嬵潡閼?- owner 閸欘垳些闂勩倖鍨氶崨?
瀵ら缚顔呮い鐢告桨娴ｅ秶鐤嗛敍?
- 閺傚洦銆傛い闈涘礁娑撳﹨顫楅弬鏉款杻 `Share` 閸忋儱褰?- 瀵湱鐛ラ崘鍛潔缁€鐑樺灇閸涙ê鍨悰銊ユ嫲鐟欐帟澹婇柅澶嬪

## 鐎圭偞鏌︽い鍝勭碍

瀵ら缚顔呴幐澶変簰娑撳銆庢惔蹇斿腹鏉╂冻绱?
1. 閺傛澘顤?`documentMembers` schema 閸滃瞼鍌ㄥ?2. 閺傛澘缂撻幒鍫熸綀瀹搞儱鍙块崙鑺ユ殶
3. 閺€褰掆偓鐘靛箛閺?`documents` 閺屻儴顕楅崪?mutation 閻ㄥ嫭娼堥梽鎰灲閺?4. 閺傛澘顤冮幋鎰喅缁狅紕鎮婇幒銉ュ經
5. 閸︺劌澧犵粩顖濐嚢閸?access 娣団剝浼呴獮鍫曟閸?UI
6. 閹恒儱鍙?Hocuspocus 閸?Yjs
7. 婢х偛濮為崷銊у殠閸楀繋缍旈懓鍛偓浣界箼缁嬪鍘滈弽鍥モ偓浣稿瀻娴滎偄鑴婄粣?
## 妞嬪酣娅撴稉搴㈡暈閹板繋绨ㄦい?
### 1. `getById` 瑜版挸澧犵€涙ê婀搾濠冩綀妞嬪酣娅?
瑜版挸澧?[convex/documents.ts](d:/Code/Frontend/docs-clone/convex/documents.ts) 閻?`getById` 濞屸剝婀侀弽锟犵崣閺傚洦銆傞幋鎰喅闊偂鍞ら妴? 
閸︺劌绱╅崗銉ュ瀻娴滎偄濮涢懗钘夊鐏忓崬绨茬拠銉ュ帥娣囶喗顒滈妴?
### 2. 娑撳秷顩﹂幎?HTML 鐎涙顑佹稉鑼埛缂侇厼缍嬫担婊冨礂閸氬奔瀵岄弫鐗堝祦濠?
婢舵矮姹夐崡蹇庣稊娑撳绱濋惄瀛樺复鐟曞棛娲?`documentContent` 娴兼艾顕遍懛杈剧窗

- 閸愯尙鐛婄憰鍡欐磰
- 閸忓鐖ｉ悩鑸碘偓浣锋丢婢?- 閺囧瓨鏌婃０鎴犲芳鏉╁洭鐝?
### 3. owner 闂団偓鐟曚礁寮婚崘娆庣閼峰瓨鈧?
`documents.ownerId` 閸?`documentMembers.role = owner` 韫囧懘銆忔穱婵囧瘮娑撯偓閼锋番鈧? 
鏉烆剛些閹碘偓閺堝娼堥弮鎯邦洣閸︺劌鎮撴稉鈧稉顏冪瑹閸斺剝鎼锋担婊堝櫡娑撯偓鐠ч攱娲块弬鑸偓?
### 4. viewer 娑撳秷鍏橀崣顏堟浆閸撳秶顏粋浣烘暏缂傛牞绶崳?
闂団偓鐟曚礁婀敍?
- Convex mutation
- Hocuspocus 闁村瓨娼?
鏉╂瑤琚辩仦鍌炲厴閹笛嗩攽閸欘亣顕伴梽鎰煑閵?
## 閹恒劏宕橀惃鍕浕娑擃亜绱戦崣鎴﹀櫡缁嬪顣?
閸忓牆鐣幋鎰ㄢ偓婊堟姜閸楀繐鎮撻悧?RBAC閳ユ繐绱?
- 閺傛澘顤?`documentMembers`
- 閺傚洦銆傞崚娑樼紦閺冩儼鍤滈崝銊ュ灡瀵?owner 閹存劕鎲?- `getById` 閺€瑙勫灇閸欘亝婀侀幋鎰喅閸欘垵顕?- `updateContentById` / `renameById` / `updateMargins` 閺€瑙勫灇 owner/editor 閸欘垰鍟?- `removeById` 閺€瑙勫灇娴?owner
- 閺傛澘顤?`getAccessById`

鐎瑰本鍨氭潻娆庨嚋闁插瞼鈻肩喊鎴濇倵閿涘苯鍟€閹恒儱鍙?Hocuspocus閿涘矂顥撻梽鈺傛付娴ｅ簺鈧?