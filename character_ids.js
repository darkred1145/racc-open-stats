// Character outfit ID mapping
// Format: "CharacterName|OutfitName" -> outfitId
// Base character IDs are the first 4 digits, outfit IDs are the full 6 digits

const CHARACTER_OUTFIT_IDS = {
    // Special Week (1001)
    "Special Week|Original": 100101,
    "Special Week|Summer": 100102,
    "Special Week|Commander": 100103,
    
    // Silence Suzuka (1002)
    "Silence Suzuka|Original": 100201,
    "Silence Suzuka|Summer": 100202,
    
    // Tokai Teio (1003)
    "Tokai Teio|Original": 100301,
    "Tokai Teio|Anime Collab": 100302,
    "Tokai Teio|Festival": 100303,
    
    // Maruzensky (1004)
    "Maruzensky|Original": 100401,
    "Maruzensky|Summer": 100402,
    "Maruzensky|New Year": 100403,
    
    // Fuji Kiseki (1005)
    "Fuji Kiseki|Original": 100501,
    "Fuji Kiseki|Ballroom": 100502,
    
    // Oguri Cap (1006)
    "Oguri Cap|Original": 100601,
    "Oguri Cap|Christmas": 100602,
    "Oguri Cap|Anime Collab": 100603,
    
    // Gold Ship (1007)
    "Gold Ship|Original": 100701,
    "Gold Ship|Summer": 100702,
    "Gold Ship|Project L'Arc": 100703,
    
    // Vodka (1008)
    "Vodka|Original": 100801,
    "Vodka|Christmas": 100802,
    
    // Daiwa Scarlet (1009)
    "Daiwa Scarlet|Original": 100901,
    "Daiwa Scarlet|Christmas": 100902,
    
    // Taiki Shuttle (1010)
    "Taiki Shuttle|Original": 101001,
    "Taiki Shuttle|Camping": 101002,
    "Taiki Shuttle|Valentine": 101003,
    
    // Grass Wonder (1011)
    "Grass Wonder|Original": 101101,
    "Grass Wonder|Fantasy": 101102,
    "Grass Wonder|New Year": 101103,
    
    // Hishi Amazon (1012)
    "Hishi Amazon|Original": 101201,
    "Hishi Amazon|Wedding": 101202,
    
    // Mejiro McQueen (1013)
    "Mejiro McQueen|Original": 101301,
    "Mejiro McQueen|Anime Collab": 101302,
    "Mejiro McQueen|Summer": 101303,
    
    // El Condor Pasa (1014)
    "El Condor Pasa|Original": 101401,
    "El Condor Pasa|Fantasy": 101402,
    
    // T.M. Opera O (1015)
    "T.M. Opera O|Original": 101501,
    "T.M. Opera O|New Year": 101502,
    
    // Narita Brian (1016)
    "Narita Brian|Original": 101601,
    "Narita Brian|Blaze": 101602,
    
    // Symboli Rudolf (1017)
    "Symboli Rudolf|Original": 101701,
    "Symboli Rudolf|Festival": 101702,
    
    // Air Groove (1018)
    "Air Groove|Original": 101801,
    "Air Groove|Wedding": 101802,
    
    // Agnes Digital (1019)
    "Agnes Digital|Original": 101901,
    "Agnes Digital|Halloween": 101902,
    
    // Seiun Sky (1020)
    "Seiun Sky|Original": 102001,
    "Seiun Sky|Ballroom": 102002,
    
    // Tamamo Cross (1021)
    "Tamamo Cross|Original": 102101,
    "Tamamo Cross|Festival": 102102,
    
    // Fine Motion (1022)
    "Fine Motion|Original": 102201,
    "Fine Motion|Wedding": 102202,
    
    // Biwa Hayahide (1023)
    "Biwa Hayahide|Original": 102301,
    "Biwa Hayahide|Christmas": 102302,
    "Biwa Hayahide|Mecha": 102303,
    
    // Mayano Top Gun (1024)
    "Mayano Top Gun|Original": 102401,
    "Mayano Top Gun|Wedding": 102402,
    "Mayano Top Gun|Halloween": 102403,
    
    // Manhattan Cafe (1025)
    "Manhattan Cafe|Original": 102501,
    "Manhattan Cafe|Valentine": 102502,
    
    // Mihono Bourbon (1026)
    "Mihono Bourbon|Original": 102601,
    "Mihono Bourbon|Valentine": 102602,
    
    // Mejiro Ryan (1027)
    "Mejiro Ryan|Original": 102701,
    "Mejiro Ryan|Valentine": 102702,
    
    // Hishi Akebono (1028)
    "Hishi Akebono|Original": 102801,
    "Hishi Akebono|Halloween": 102802,
    
    // Yukino Bijin (1029)
    "Yukino Bijin|Original": 102901,
    "Yukino Bijin|Valentine": 102902,
    
    // Rice Shower (1030)
    "Rice Shower|Original": 103001,
    "Rice Shower|Halloween": 103002,
    "Rice Shower|Great Food Festival": 103003,
    
    // Ines Fujin (1031)
    "Ines Fujin|Original": 103101,
    "Ines Fujin|Valentine": 103102,
    "Ines Fujin|Deserted Island": 103103,
    
    // Agnes Tachyon (1032)
    "Agnes Tachyon|Original": 103201,
    "Agnes Tachyon|Summer": 103202,
    "Agnes Tachyon|Alt Version": 103203,
    
    // Admire Vega (1033)
    "Admire Vega|Original": 103301,
    "Admire Vega|Christmas": 103302,
    
    // Inari One (1034)
    "Inari One|Original": 103401,
    "Inari One|Festival": 103402,
    
    // Winning Ticket (1035)
    "Winning Ticket|Original": 103501,
    "Winning Ticket|Steampunk": 103502,
    "Winning Ticket|U.A.F.": 103503,
    
    // Air Shakur (1036)
    "Air Shakur|Original": 103601,
    "Air Shakur|Halloween": 103602,
    
    // Eishin Flash (1037)
    "Eishin Flash|Original": 103701,
    "Eishin Flash|Valentine": 103702,
    "Eishin Flash|Summer Trip": 103703,
    
    // Curren Chan (1038)
    "Curren Chan|Original": 103801,
    "Curren Chan|Wedding": 103802,
    
    // Kawakami Princess (1039)
    "Kawakami Princess|Original": 103901,
    "Kawakami Princess|Festival": 103902,
    
    // Gold City (1040)
    "Gold City|Original": 104001,
    "Gold City|Festival": 104002,
    "Gold City|Deserted Island": 104003,
    
    // Sakura Bakushin O (1041)
    "Sakura Bakushin O|Original": 104101,
    "Sakura Bakushin O|Sports Festival": 104102,
    "Sakura Bakushin O|Ballroom": 104103,
    
    // Seeking the Pearl (1042)
    "Seeking the Pearl|Original": 104201,
    "Seeking the Pearl|Halloween": 104202,
    
    // Shinko Windy (1043)
    "Shinko Windy|Original": 104301,
    
    // Sweep Tosho (1044)
    "Sweep Tosho|Original": 104401,
    "Sweep Tosho|Wedding": 104402,
    
    // Super Creek (1045)
    "Super Creek|Original": 104501,
    "Super Creek|Halloween": 104502,
    "Super Creek|Warfare": 104503,
    
    // Smart Falcon (1046)
    "Smart Falcon|Original": 104601,
    "Smart Falcon|Grand Live": 104602,
    "Smart Falcon|Parade": 104603,
    
    // Zenno Rob Roy (1047)
    "Zenno Rob Roy|Original": 104701,
    "Zenno Rob Roy|Autumn": 104702,
    
    // Tosen Jordan (1048)
    "Tosen Jordan|Original": 104801,
    "Tosen Jordan|Summer Trip": 104802,
    "Tosen Jordan|Halloween": 104803,
    
    // Nakayama Festa (1049)
    "Nakayama Festa|Original": 104901,
    "Nakayama Festa|Christmas": 104902,
    
    // Narita Taishin (1050)
    "Narita Taishin|Original": 105001,
    "Narita Taishin|Steampunk": 105002,
    "Narita Taishin|Mecha": 105003,
    
    // Nishino Flower (1051)
    "Nishino Flower|Original": 105101,
    "Nishino Flower|Wedding": 105102,
    
    // Haru Urara (1052)
    "Haru Urara|Original": 105201,
    "Haru Urara|New Year": 105202,
    
    // Bamboo Memory (1053)
    "Bamboo Memory|Original": 105301,
    "Bamboo Memory|Summer Trip": 105302,
    
    // Biko Pegasus (1054)
    "Biko Pegasus|Original": 105401,
    
    // Marvelous Sunday (1055)
    "Marvelous Sunday|Original": 105501,
    "Marvelous Sunday|Halloween": 105502,
    
    // Matikanefukukitaru (1056)
    "Matikanefukukitaru|Original": 105601,
    "Matikanefukukitaru|Full Armor": 105602,
    
    // Mr. C.B. (1057)
    "Mr. C.B.|Original": 105701,
    "Mr. C.B.|New Year": 105702,
    
    // Meisho Doto (1058)
    "Meisho Doto|Original": 105801,
    "Meisho Doto|Halloween": 105802,
    
    // Mejiro Dober (1059)
    "Mejiro Dober|Original": 105901,
    "Mejiro Dober|Camping": 105902,
    
    // Nice Nature (1060)
    "Nice Nature|Original": 106001,
    "Nice Nature|Cheerleader": 106002,
    "Nice Nature|New Year": 106003,
    
    // King Halo (1061)
    "King Halo|Original": 106101,
    "King Halo|Cheerleader": 106102,
    "King Halo|Wedding": 106103,
    
    // Matikanetannhauser (1062)
    "Matikanetannhauser|Original": 106201,
    "Matikanetannhauser|Sports Festival": 106202,
    
    // Ikuno Dictus (1063)
    "Ikuno Dictus|Original": 106301,
    "Ikuno Dictus|New Year": 106302,
    
    // Mejiro Palmer (1064)
    "Mejiro Palmer|Original": 106401,
    "Mejiro Palmer|Christmas": 106402,
    
    // Daitaku Helios (1065)
    "Daitaku Helios|Original": 106501,
    "Daitaku Helios|Ballroom": 106502,
    
    // Twin Turbo (1066)
    "Twin Turbo|Original": 106601,
    
    // Satono Diamond (1067)
    "Satono Diamond|Original": 106701,
    "Satono Diamond|New Year": 106702,
    "Satono Diamond|Project L'Arc": 106703,
    
    // Kitasan Black (1068)
    "Kitasan Black|Original": 106801,
    "Kitasan Black|New Year": 106802,
    "Kitasan Black|Anime Collab": 106803,
    
    // Sakura Chiyono O (1069)
    "Sakura Chiyono O|Original": 106901,
    "Sakura Chiyono O|Ballroom": 106902,
    
    // Sirius Symboli (1070)
    "Sirius Symboli|Original": 107001,
    "Sirius Symboli|The Twinkle Legends": 107002,
    
    // Mejiro Ardan (1071)
    "Mejiro Ardan|Original": 107101,
    "Mejiro Ardan|Ballroom": 107102,
    
    // Yaeno Muteki (1072)
    "Yaeno Muteki|Original": 107201,
    "Yaeno Muteki|Warfare": 107202,
    
    // Tsurumaru Tsuyoshi (1073)
    "Tsurumaru Tsuyoshi|Original": 107301,
    
    // Mejiro Bright (1074)
    "Mejiro Bright|Original": 107401,
    "Mejiro Bright|Christmas": 107402,
    
    // Sakura Laurel (1076)
    "Sakura Laurel|Original": 107601,
    "Sakura Laurel|New Year": 107602,
    
    // Narita Top Road (1077)
    "Narita Top Road|Original": 107701,
    "Narita Top Road|Christmas": 107702,
    
    // Yamanin Zephyr (1078)
    "Yamanin Zephyr|Original": 107801,
    "Yamanin Zephyr|Valentine": 107802,
    
    // Furioso (1079)
    "Furioso|Original": 107901,
    
    // Transcend (1080)
    "Transcend|Original": 108001,
    "Transcend|Onsen": 108002,
    
    // Espoir City (1081)
    "Espoir City|Original": 108101,
    
    // North Flight (1082)
    "North Flight|Original": 108201,
    "North Flight|Ballroom": 108202,
    
    // Symboli Kris S (1083)
    "Symboli Kris S|Original": 108301,
    "Symboli Kris S|Halloween": 108302,
    
    // Tanino Gimlet (1084)
    "Tanino Gimlet|Original": 108401,
    "Tanino Gimlet|Ballroom": 108402,
    
    // Daiichi Ruby (1085)
    "Daiichi Ruby|Original": 108501,
    "Daiichi Ruby|Ballroom": 108502,
    
    // Mejiro Ramonu (1086)
    "Mejiro Ramonu|Original": 108601,
    "Mejiro Ramonu|Wedding": 108602,
    
    // Aston Machan (1087)
    "Aston Machan|Original": 108701,
    "Aston Machan|Valentine": 108702,
    
    // Satono Crown (1088)
    "Satono Crown|Original": 108801,
    "Satono Crown|Summer": 108802,
    
    // Cheval Grand (1089)
    "Cheval Grand|Original": 108901,
    "Cheval Grand|Summer": 108902,
    
    // Verxina (1090)
    "Verxina|Original": 109001,
    
    // Vivlos (1091)
    "Vivlos|Original": 109101,
    "Vivlos|Summer": 109102,
    
    // Dantsu Flame (1092)
    "Dantsu Flame|Original": 109201,
    
    // K.S. Miracle (1093)
    "K.S. Miracle|Original": 109301,
    "K.S. Miracle|Alt Version": 109302,
    
    // Jungle Pocket (1094)
    "Jungle Pocket|Original": 109401,
    
    // Believe (1095)
    "Believe|Original": 109501,
    
    // No Reason (1096)
    "No Reason|Original": 109601,
    
    // Still in Love (1097)
    "Still in Love|Original": 109701,
    
    // Copano Rickey (1098)
    "Copano Rickey|Original": 109801,
    "Copano Rickey|Parade": 109802,
    
    // Hokko Tarumae (1099)
    "Hokko Tarumae|Original": 109901,
    "Hokko Tarumae|Summer Trip": 109902,
    
    // Wonder Acute (1100)
    "Wonder Acute|Original": 110001,
    "Wonder Acute|Onsen": 110002,
    
    // Sounds of Earth (1102)
    "Sounds of Earth|Original": 110201,
    "Sounds of Earth|Valentine": 110202,
    
    // Royce and Royce (1103)
    "Royce and Royce|Original": 110301,
    
    // Katsuragi Ace (1104)
    "Katsuragi Ace|Original": 110401,
    "Katsuragi Ace|New Year": 110402,
    
    // Neo Universe (1105)
    "Neo Universe|Original": 110501,
    "Neo Universe|Autumn": 110502,
    
    // Hishi Miracle (1106)
    "Hishi Miracle|Original": 110601,
    "Hishi Miracle|Alt Version": 110602,
    
    // Tap Dance City (1107)
    "Tap Dance City|Original": 110701,
    "Tap Dance City|Ballroom": 110702,
    
    // Duramente (1108)
    "Duramente|Original": 110801,
    
    // Rhein Kraft (1109)
    "Rhein Kraft|Original": 110901,
    "Rhein Kraft|Alt Version": 110902,
    
    // Cesario (1110)
    "Cesario|Original": 111001,
    "Cesario|Wedding": 111002,
    
    // Air Messiah (1111)
    "Air Messiah|Original": 111101,
    
    // Fusaichi Pandora (1113)
    "Fusaichi Pandora|Original": 111301,
    
    // Buena Vista (1114)
    "Buena Vista|Original": 111401,
    
    // Orfevre (1115)
    "Orfevre|Original": 111501,
    
    // Gentildonna (1116)
    "Gentildonna|Original": 111601,
    
    // Win Variation (1117)
    "Win Variation|Original": 111701,
    
    // Dream Journey (1119)
    "Dream Journey|Original": 111901,
    "Dream Journey|Christmas": 111902,
    
    // Calstone Light O (1120)
    "Calstone Light O|Original": 112001,
    
    // Durandal (1121)
    "Durandal|Original": 112101,
    
    // Bubble Gum Fellow (1124)
    "Bubble Gum Fellow|Original": 112401,
    "Bubble Gum Fellow|New Year": 112402,
    
    // Fenomeno (1127)
    "Fenomeno|Original": 112701,
    
    // Almond Eye (1129)
    "Almond Eye|Original": 112901,
    
    // Gran Alegria (1131)
    "Gran Alegria|Original": 113101,
    
    // Loves Only You (1132)
    "Loves Only You|Original": 113201,
    "Loves Only You|Beyond Dreams": 113202,
    
    // Chrono Genesis (1133)
    "Chrono Genesis|Original": 113301,
    
    // Stay Gold (1135)
    "Stay Gold|Original": 113501,
    
    // Kiseki (1137)
    "Kiseki|Original": 113701,
    
    // Victoire Pisa (1143)
    "Victoire Pisa|Original": 114301,
};

// Helper function to get outfit ID
function getOutfitId(characterName, outfitName) {
    const key = `${characterName}|${outfitName}`;
    return CHARACTER_OUTFIT_IDS[key] || null;
}

// Helper function to get icon URL
function getCharacterIconUrl(characterName, outfitName) {
    const outfitId = getOutfitId(characterName, outfitName);
    if (!outfitId) {
        // Fallback: try to extract base ID and use default
        return null;
    }
    
    // Extract base character ID (first 4 digits)
    const baseId = Math.floor(outfitId / 100);
    
    // Generate gametora.com URL
    return `https://gametora.com/images/umamusume/characters/chara_stand_${baseId}_${outfitId}.png`;
}
