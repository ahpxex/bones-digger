import type { BonePosition, KnowledgeCard, Species } from "@/lib/types";

const SPECIES_LATIN: Record<Species, string> = {
  马: "Equus caballus",
  黄牛: "Bos taurus",
  水牛: "Bubalus bubalis",
  鹿: "Cervidae spp.",
  羊: "Ovis / Capra",
  猪: "Sus scrofa",
  狗: "Canis lupus familiaris",
  未知: "incertae sedis",
};

const POSITION_LATIN: Partial<Record<BonePosition, string>> = {
  掌骨: "Metacarpus",
  跖骨: "Metatarsus",
  趾骨: "Phalanx",
  距骨: "Talus",
  跟骨: "Calcaneus",
  尺骨: "Ulna",
  桡骨: "Radius",
  股骨: "Femur",
  胫骨: "Tibia",
  头骨: "Cranium",
  牙齿: "Dentition",
  上颌: "Maxilla",
  下颌: "Mandibula",
  齿式: "Dental formula",
  寰椎: "Atlas",
  枢椎: "Axis",
  肩胛骨: "Scapula",
  肱骨: "Humerus",
};

type Row = {
  species: Species;
  position: BonePosition;
  features: string[];
};

const RAW: Row[] = [
  // ===== 掌骨 =====
  {
    species: "马",
    position: "掌骨",
    features: [
      "发达的第三掌骨，第二、第四掌骨退化",
      "远端只有一个滑车",
      "近端有小斜面，冲外",
      "骨体整体扁平",
    ],
  },
  {
    species: "黄牛",
    position: "掌骨",
    features: [
      "第三、第四掌骨愈合为一块（炮骨）",
      "远端两个滑车",
      "近端关节面内大外小",
      "中有沟槽，为鹿牛羊偶蹄目特有",
      "相对于跖骨，掌骨扁",
    ],
  },
  {
    species: "鹿",
    position: "掌骨",
    features: ["前面的血槽在滋养孔处断开", "炮骨结构与牛相近但更瘦长"],
  },
  {
    species: "羊",
    position: "掌骨",
    features: ["前面的血槽直至滋养孔，不断开", "炮骨结构"],
  },
  {
    species: "猪",
    position: "掌骨",
    features: ["有四个独立掌骨，不愈合成炮骨", "骨体粗短"],
  },

  // ===== 跖骨 =====
  {
    species: "马",
    position: "跖骨",
    features: [
      "跖骨断面较方（掌骨扁、跖骨方）",
      "近端呈半环状（与掌骨近端的平面不同）",
    ],
  },
  {
    species: "黄牛",
    position: "跖骨",
    features: ["跖骨断面方整", "跖骨近端有一小斜面冲外"],
  },

  // ===== 趾骨 =====
  {
    species: "马",
    position: "趾骨",
    features: ["近端关节面有凹槽", "单趾：第 1、2、3 趾节为单一序列"],
  },
  {
    species: "黄牛",
    position: "趾骨",
    features: ["第 1、2、3 趾节分左右两排", "两趾偶蹄目结构"],
  },

  // ===== 距骨 =====
  {
    species: "马",
    position: "距骨",
    features: ["单滑车结构", "内侧有明显突起"],
  },
  {
    species: "黄牛",
    position: "距骨",
    features: [
      "双滑车结构",
      "距骨脊冲向前上方",
      "前外侧有关节面与跟骨相连",
    ],
  },
  {
    species: "鹿",
    position: "距骨",
    features: ["双滑车", "滑车两侧脊平行"],
  },
  {
    species: "羊",
    position: "距骨",
    features: ["双滑车", "滑车两侧脊不平行"],
  },

  // ===== 跟骨 =====
  {
    species: "马",
    position: "跟骨",
    features: ["跟骨脊平齐", "前突短"],
  },
  {
    species: "黄牛",
    position: "跟骨",
    features: [
      "偶蹄目：跟骨体终止于跟骨头",
      "前突带有三角形尖",
      "反刍类载距突达到甚至超过后缘",
    ],
  },
  {
    species: "鹿",
    position: "跟骨",
    features: ["与牛相近", "较羊更显瘦长"],
  },
  {
    species: "猪",
    position: "跟骨",
    features: ["载距突达不到关节面", "骨体粗短"],
  },

  // ===== 尺骨 =====
  {
    species: "马",
    position: "尺骨",
    features: [
      "退化并与桡骨愈合",
      "尺骨上结节内弯",
      "无三角形突起",
      "半月切迹冲前或冲内，下外角",
    ],
  },
  {
    species: "黄牛",
    position: "尺骨",
    features: [
      "与桡骨等长，之间有缝隙",
      "尺骨结节粗大",
      "半月切迹外侧有三角形突起，与桡骨相接",
    ],
  },
  {
    species: "鹿",
    position: "尺骨",
    features: ["尺骨明显退化"],
  },
  {
    species: "猪",
    position: "尺骨",
    features: ["尺骨发育充分，断面为三角形"],
  },

  // ===== 桡骨 =====
  {
    species: "马",
    position: "桡骨",
    features: [
      "桡骨结节明显，位于前内侧",
      "远端呈轴状，内前方轴向下",
      "前方有三个竖窝",
      "上端窝内大外小",
    ],
  },
  {
    species: "黄牛",
    position: "桡骨",
    features: [
      "近端窝的后外侧有三角形突起",
      "结节为一个平面",
      "尺骨茎突位于外侧",
      "下端有三个斜窝",
    ],
  },
  {
    species: "鹿",
    position: "桡骨",
    features: [
      "近端有三角形突起与圆形小面",
      "远端有明显脊",
    ],
  },
  {
    species: "羊",
    position: "桡骨",
    features: ["与牛相似的三角形突起", "骨体较细"],
  },
  {
    species: "猪",
    position: "桡骨",
    features: ["粗短", "近端没有三角形切迹", "远端粗短"],
  },

  // ===== 股骨 =====
  {
    species: "马",
    position: "股骨",
    features: [
      "有第三转子",
      "股骨头呈半圆形，股骨头窝明显",
      "大转子分为大转子与中转子两部",
      "大转子后脊向下与小转子相接",
      "小转子位于后内侧，无明显结节",
      "滑车短，髁上窝很深呈窝状",
      "股骨头位于内侧，大小转子靠后",
      "远端内大外小",
    ],
  },
  {
    species: "黄牛",
    position: "股骨",
    features: [
      "无第三转子",
      "股骨头圆球状，股骨头窝浅而小",
      "大转子未分开",
      "脊斜向",
      "小转子位于后外侧，结节明显",
      "髌骨滑车较长，髁上窝浅而长呈沟状",
    ],
  },
  {
    species: "鹿",
    position: "股骨",
    features: ["髁上窝浅", "股骨头较长", "大转子窄而高"],
  },
  {
    species: "羊",
    position: "股骨",
    features: ["髁上窝浅", "整体接近鹿但骨体更细"],
  },
  {
    species: "猪",
    position: "股骨",
    features: [
      "髁上窝为一平面",
      "骨体为带棱方形",
      "股骨头为断开的圆头",
      "大转子宽短",
    ],
  },

  // ===== 胫骨 =====
  {
    species: "马",
    position: "胫骨",
    features: [
      "腓骨残存一小段",
      "上端脊上窝明显",
      "下端斜轴分为两斜沟",
      "切迹位于前内侧",
      "胫骨脊外缘外撇，位居前方",
    ],
  },
  {
    species: "黄牛",
    position: "胫骨",
    features: [
      "腓骨退化",
      "脊上窝不明显",
      "下端外侧有两个关节窝（髁关节面，前小后大）",
      "远端为两条正沟",
    ],
  },
  {
    species: "鹿",
    position: "胫骨",
    features: [
      "骨体稍弯",
      "远端有髁关节面",
      "胫骨脊超过骨体 1/2",
      "整体细长",
    ],
  },
  {
    species: "羊",
    position: "胫骨",
    features: ["骨体直", "骨壁光滑细腻", "有髁关节面"],
  },
  {
    species: "猪",
    position: "胫骨",
    features: ["没有髁关节面", "胫骨脊粗短"],
  },

  // ===== 头骨 =====
  {
    species: "马",
    position: "头骨",
    features: [
      "眶上孔结构",
      "泪骨宽短",
      "枕部由一块枕骨组成",
      "枕部呈三角形，颈窝大而深",
      "顶骨矢状脊分支",
    ],
  },
  {
    species: "黄牛",
    position: "头骨",
    features: [
      "眶上沟（非孔）结构",
      "泪骨宽大",
      "枕部由枕骨与顶骨共同组成",
      "颈窝为粗糙面，有角心",
      "后方为额后脊，额骨宽平",
      "椭圆形角",
      "角心内弯，顶骨不明显",
    ],
  },
  {
    species: "水牛",
    position: "头骨",
    features: [
      "三角形角",
      "额骨高耸",
      "角向后折下",
      "顶骨明显可见",
    ],
  },
  {
    species: "鹿",
    position: "头骨",
    features: [
      "角长在额骨上",
      "额骨宽平，顶骨发育，额面凹陷",
      "眶上孔",
      "泪骨发育，呈漏斗状（泪前窝）",
      "泪骨与鼻骨之间有空隙",
      "眼眶封闭",
    ],
  },
  {
    species: "猪",
    position: "头骨",
    features: [
      "额骨陡直，向后折",
      "额面髁发育，茎突特长",
      "泪骨宽短（野猪较长）",
      "眼眶不封闭，呈半月形",
    ],
  },
  {
    species: "狗",
    position: "头骨",
    features: [
      "颧弓发达，矢状嵴发育",
      "枕部为三角形",
      "听泡发育",
      "额骨和顶骨厚，内有气室构造",
    ],
  },

  // ===== 牙齿 =====
  {
    species: "马",
    position: "牙齿",
    features: [
      "嵴形齿",
      "上牙一般有马刺（骡子没有，驴与马相同但个体较小）",
      "三趾马原尖为单独的圆圈",
      "上牙原尖位于舌侧前方，下牙原尖位于颊侧前方",
      "上方下扁，齿跟后弯",
      "上牙三个齿跟（舌侧一个），下牙两个齿跟",
      "上牙嚼面舌侧低颊侧高，下牙相反",
    ],
  },
  {
    species: "黄牛",
    position: "牙齿",
    features: [
      "新月形齿",
      "臼齿上有齿柱，超过齿冠 1/2",
      "下 M3 由三页组成，第三页较小",
      "外覆白垩质",
      "附尖褶发育",
    ],
  },
  {
    species: "鹿",
    position: "牙齿",
    features: [
      "新月型齿",
      "臼齿上有椎状齿柱，低于齿冠 1/2",
      "珐琅质表面粗糙",
      "附尖褶发育（下牙舌侧、上牙颊侧）",
      "下 M3 三叶，上第三臼齿非三叶但多一褶",
    ],
  },
  {
    species: "羊",
    position: "牙齿",
    features: [
      "臼齿上没有齿柱",
      "珐琅质表面光滑",
      "臼齿上的附尖褶平",
    ],
  },
  {
    species: "猪",
    position: "牙齿",
    features: [
      "杂食动物，丘形齿",
      "四个主尖 + 小的附尖",
      "磨损后形成小的珐琅质环",
      "上 P4 圆形",
    ],
  },

  // ===== 上颌 =====
  {
    species: "马",
    position: "上颌",
    features: [
      "6 个门齿",
      "犬齿小（雌马退化）",
      "齿槽一般大小",
    ],
  },
  {
    species: "黄牛",
    position: "上颌",
    features: [
      "前为一骨质骨板",
      "没有门齿",
      "齿槽前小后大",
    ],
  },

  // ===== 下颌 =====
  {
    species: "马",
    position: "下颌",
    features: [
      "为一个整骨，宽大，缘厚",
      "髁突为一鼓出的轴",
      "冠状突内撇",
    ],
  },
  {
    species: "黄牛",
    position: "下颌",
    features: [
      "下颌愈合为一个",
      "前方各四个齿槽（犬齿门齿化）",
      "扁平板状",
      "髁突为一斜面",
      "冠状突外撇",
    ],
  },
  {
    species: "鹿",
    position: "下颌",
    features: ["冠状突高，宽扁", "下缘边缘不同于羊"],
  },
  {
    species: "羊",
    position: "下颌",
    features: ["冠状突高，细", "冠状突向后弯折"],
  },
  {
    species: "猪",
    position: "下颌",
    features: [
      "下颌联合愈合（野猪吻部突出，家猪后缩）",
      "下颌体厚大",
      "冠状突小，低矮",
      "髁突大，呈三角形关节面",
    ],
  },

  // ===== 齿式 =====
  {
    species: "马",
    position: "齿式",
    features: ["上 3·1·3·3", "下 3·1·3·3"],
  },
  {
    species: "黄牛",
    position: "齿式",
    features: ["上 0·0·3·3", "下 3·1·3·3"],
  },
  {
    species: "鹿",
    position: "齿式",
    features: ["上 0·1·3·3", "下 3·1·3·3"],
  },
  {
    species: "猪",
    position: "齿式",
    features: ["上 3·1·4·3", "下 3·1·4·3"],
  },
  {
    species: "狗",
    position: "齿式",
    features: ["上 3·1·4·2", "下 3·1·4·3"],
  },

  // ===== 寰椎 =====
  {
    species: "马",
    position: "寰椎",
    features: [
      "翼上 4 孔",
      "接枢椎的部位分开呈两个耳状关节面",
    ],
  },
  {
    species: "黄牛",
    position: "寰椎",
    features: [
      "翼上 2 孔",
      "接枢椎的部位呈平的关节面",
      "腹侧关节面可见",
    ],
  },
  {
    species: "鹿",
    position: "寰椎",
    features: ["椎孔为圆形", "椎体高"],
  },
  {
    species: "羊",
    position: "寰椎",
    features: ["椎体矮", "腹侧关节面可见"],
  },
  {
    species: "猪",
    position: "寰椎",
    features: ["椎体孔为葫芦形"],
  },
  {
    species: "狗",
    position: "寰椎",
    features: ["两翼宽大", "背弓拱起", "腹侧弓平缓"],
  },

  // ===== 枢椎 =====
  {
    species: "马",
    position: "枢椎",
    features: [
      "椎体长（哺乳类 7 颈椎中最长）",
      "齿突部位为耳状关节面",
    ],
  },
  {
    species: "黄牛",
    position: "枢椎",
    features: [
      "椎体短",
      "齿突部位呈半圆形关节面",
    ],
  },
  {
    species: "鹿",
    position: "枢椎",
    features: ["半圆形齿突"],
  },
  {
    species: "猪",
    position: "枢椎",
    features: ["棘突高起", "锥状齿突"],
  },
  {
    species: "狗",
    position: "枢椎",
    features: ["锥状齿突", "耳状关节面"],
  },

  // ===== 肩胛骨 =====
  {
    species: "马",
    position: "肩胛骨",
    features: [
      "前肩胛切迹明显",
      "肩峰不发育",
      "肩胛岗中岗结节发育",
      "肩胛前结节与关节窝有一段距离",
      "乌喙突发育",
    ],
  },
  {
    species: "黄牛",
    position: "肩胛骨",
    features: [
      "整体呈三角形",
      "肩峰发育",
      "没有岗结节",
      "关节窝紧靠前结节",
      "乌喙突不明显",
    ],
  },
  {
    species: "鹿",
    position: "肩胛骨",
    features: [
      "前结节低于关节窝",
      "关节窝圆",
      "肩峰明显",
    ],
  },
  {
    species: "羊",
    position: "肩胛骨",
    features: [
      "前结节突起",
      "前方有切迹",
      "肩峰明显",
    ],
  },
  {
    species: "猪",
    position: "肩胛骨",
    features: [
      "前方为圆形（鹿和羊为三角形）",
      "没有肩峰",
      "岗结节发育",
    ],
  },
  {
    species: "狗",
    position: "肩胛骨",
    features: [
      "前缘和背侧缘呈圆弧状",
      "肩峰发育呈勾状，与关节窝平",
      "肩胛前结节显著",
      "关节窝不圆",
    ],
  },

  // ===== 肱骨 =====
  {
    species: "马",
    position: "肱骨",
    features: [
      "大结节前上方有复式滑车",
      "大结节较平",
      "结节间沟不明显",
      "三角粗隆明显，向后外侧翻转",
      "两个冠状深窝",
      "远端鹰嘴窝深窄",
      "滑车冲前方，内大外小",
    ],
  },
  {
    species: "黄牛",
    position: "肱骨",
    features: [
      "大结节前方有附着岗下肌的结节面",
      "大结节较高",
      "结节间沟明显",
      "三角粗隆不明显",
      "一个冠状深窝",
      "远端鹰嘴窝宽阔",
    ],
  },
  {
    species: "鹿",
    position: "肱骨",
    features: [
      "大结节内弯，间沟窄",
      "近端较宽略方",
      "滑车宽高肥厚，切迹明显",
    ],
  },
  {
    species: "羊",
    position: "肱骨",
    features: [
      "间沟宽阔",
      "远端与牛相似",
      "滑车内外悬殊",
    ],
  },
  {
    species: "猪",
    position: "肱骨",
    features: [
      "大结节间沟窄，大结节窄",
      "近端长条形",
      "远端滑车向前方收缩",
      "多有滑车上孔",
    ],
  },
  {
    species: "狗",
    position: "肱骨",
    features: [
      "肱骨头与大小结节在同一平面上",
      "大结节位于前外侧",
      "肱骨脊冲前外侧方向",
      "狗有滑车上孔",
    ],
  },
];

function makeId(species: Species, position: BonePosition): string {
  return `${species}-${position}`;
}

function makeSummary(row: Row): string {
  return row.features.slice(0, 2).join("；");
}

export const KNOWLEDGE_CARDS: KnowledgeCard[] = RAW.map((row) => ({
  id: makeId(row.species, row.position),
  species: row.species,
  position: row.position,
  features: row.features,
  summary: makeSummary(row),
}));

export const SPECIES_LIST: Species[] = [
  "马",
  "黄牛",
  "水牛",
  "鹿",
  "羊",
  "猪",
  "狗",
];

export const POSITION_LIST: BonePosition[] = [
  "头骨",
  "下颌",
  "上颌",
  "牙齿",
  "齿式",
  "寰椎",
  "枢椎",
  "肩胛骨",
  "肱骨",
  "桡骨",
  "尺骨",
  "股骨",
  "胫骨",
  "掌骨",
  "跖骨",
  "距骨",
  "跟骨",
  "趾骨",
];

export function speciesLatin(s: Species): string {
  return SPECIES_LATIN[s];
}

export function positionLatin(p: BonePosition): string | undefined {
  return POSITION_LATIN[p];
}

export function cardFor(
  species: Species,
  position: BonePosition,
): KnowledgeCard | undefined {
  return KNOWLEDGE_CARDS.find(
    (c) => c.species === species && c.position === position,
  );
}

export function cardsForPosition(position: BonePosition): KnowledgeCard[] {
  return KNOWLEDGE_CARDS.filter((c) => c.position === position);
}

export function cardsForSpecies(species: Species): KnowledgeCard[] {
  return KNOWLEDGE_CARDS.filter((c) => c.species === species);
}
