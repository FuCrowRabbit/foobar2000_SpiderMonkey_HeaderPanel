// ==PREPROCESSOR==
//@import "%fb2k_profile_path%\user-components\foo_jscript_panel\docs\Helpers.txt"
//@name "foobar2000_SpiderMonkey_HeaderPanel"
//@version "5.2.1"
//@author "FuCrowRabbit"
// ==/PREPROCESSOR==
include("C:\\Users\\CrowRabbit\\AppData\\Roaming\\foobar2000\\user-components\\foo_jscript_panel\\docs\\Helpers.txt");

// Use with GdiDrawText() 
var DT_CENTER = 0x00000001;
var DT_RIGHT  = 0x00000002;
var DT_VCENTER = 0x00000004;
var DT_WORDBREAK = 0x00000010;
var DT_CALCRECT = 0x00000400;
var DT_NOPREFIX = 0x00000800;
var DT_END_ELLIPSIS = 0x00008000;//DT_END_ELLIPSIS = "..."の追加(DT_WORDBREAKを外すこと)
var shift = 1010;

 // ==Panel====
//window.SetProperty("LowQualityMode",true);
//var LowQualityMode = window.GetProperty("LowQualityMode",true);

// Used in window.GetColorCUI()
var ColorTypeCUI = {
    text: 0,
    selection_text: 1,
    inactive_selection_text: 2,
    background: 3,
    selection_background: 4,
    inactive_selection_background: 5,
    active_item_frame: 6
};

//アルファ(不透明度)付きRGB関数
function RGBA(r, g, b, a) {
    return ((a << 24) | (r << 16) | (g << 8) | (b));
}

//新クラス サイズを格納する
function RectClass(x,y,w,h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

var InfoPanelRectClass = new RectClass(0,0,205,110);
var InfoPanelArtistRectClass = new RectClass(0,7,InfoPanelRectClass.w,InfoPanelRectClass.h);
var InfoPanelAlbumRectClass = new RectClass(0,27,InfoPanelRectClass.w,InfoPanelRectClass.h);
var InfoPanelTitleRectClass = new RectClass(0,47,InfoPanelRectClass.w,InfoPanelRectClass.h);
var InfoPanelRemainingRectClass = new RectClass(183,0,20,InfoPanelRectClass.h);
var MainMessageRectClass = new RectClass(595,13,440,50);
var NextRectClass = new RectClass(600, 60, 80, 30);
var SubMessageRectClass = new RectClass(680,59,340,50);
var VolumeRectClass = new RectClass(255,27,300,18); 
var TimeRectClass = new RectClass(12+shift, 0, 330, 130);


// Used in window.GetFontCUI()
var FontTypeCUI = {
    items: 0,
    labels: 1
};

// Used in window.GetColorDUI()
var ColorTypeDUI = {
    text: 0,
    background: 1,
    highlight: 2,
    selection: 3
};

// Used in window.GetFontDUI()
var FontTypeDUI = {
    defaults: 0,
    tabs: 1,
    lists: 2,
    playlists: 3,
    statusbar: 4,
    console: 5
};

function ApplyBlur(image, blurValue) {
    var w = image.Width;
    var h = image.Height;

    var tmp = image.Resize(w * blurValue / 100, h * blurValue / 100, 7); // 画像を縮小する
    var blurred_image = tmp.Resize(w, h, 7); // 縮小した画像を元のサイズに戻す（縮小率によって画像のblur具合が変化する）
    tmp.Dispose();
    image.Dispose();
    
    var newImg = gdi.CreateImage(w, h);
    var canvas = newImg.GetGraphics();
    var offset = 100 - blurValue;
    canvas.DrawImage(blurred_image, 0 - offset, 0 - offset, w + offset * 2, h + offset * 2, 0, 0, w, h, 0, 255); // 上下左右をoffsetの値分だけ引き伸ばして中央部分を切り取った形 // blurValue が小さいほど切り取る部分がより中央になる

    newImg.ReleaseGraphics(canvas);
    blurred_image.Dispose();

    return newImg;
}

// Used in window.SetCursor()
var IDC_HAND = 32649;

//Initialize
var TitleFont = gdi.Font("源真ゴシック", 37, 0);
var SubTitleFont = gdi.Font("源真ゴシック", 34, 0);
var g_text = "JScript Panel.\n\nClick here to open the editor.";
var ww = 0, wh = 0;
var Elapsed = Remaining = Total = SampleRate = BitsperSample = BitRate = Channels = Years = Bpm = Encord ="";
var PrevTempo = 0;//前のTempo
var NextTempo = 0;//次のTempo
var g_textcolor = 0, g_textcolor_hl = 0;
var g_backcolor = 0;
var g_hot = false;
var Title = "Welcome to the foobar2000";
var NextTitle = "";//SubMessageと一緒にしないこと
var Loading = false;
var boolRestart = true;//停止からの再生かどうか
var NextMessageType = 0;//0:Play, 1:Stop(自然的), 2:Stop(人為的), 3:Random or Shuffle,
var SubMessage = "Select Music and Enjoy";
var Stop_reason = 1;//0=他の曲が始まった 1=完全に停止
var Initialization = true;
var SelectHandle = null;
var TrackNumber = "00";
var DiscNumber = 0;

var ResetID_Interval = 0;//インターバル用
var ResetID_Timeout = 0;//タイムアウト用
var Title_len = 0;//Titleの長さ
var Title_len_wh = 0;//Titleの長さ(縦)
var Title_ww = shift-MainMessageRectClass.x;//Titleの右端
var Title_Position = 0;//Titleの左端

var ResetID_2ndPage = 0;
var PageNumber = 1;
var _2ndhalf = false;//後半を過ぎたかどうか
var _2ndhalf_flag = false;

var TotalEven = false;//Totalが奇数か偶数か

var Orange = RGBA(200,120,0,255);//キューで使用
var Red = RGBA(210,50,40,255);//停止で使用
var Blue = RGBA(0,100,200,255);//ランダム系で使用
var Pink = RGBA(200,100,190,255);//2ndで使用
var Cyan = RGBA(0,200,200,255);//1stで使用
var Cyan2 = RGBA(60,210,210,255);
var Grey = RGBA(100,100,100,255);//Prevで使用
var Green = RGBA(0,210,60,255);//中間地点で使用


var g_is_default_ui = window.InstanceType;
var g_font = gdi.Font("NotoSansCJKjp-Regular", 16, 1);
var g_system_font = gdi.Font("NotoSansCJKjp-Regular", 13, 1);
var g_artist = fb.TitleFormat("%Artist%").Eval();
var g_album = fb.TitleFormat("%Album%").Eval();
var g_title = fb.TitleFormat("%Title%").Eval();
var ww = window.Width, wh = window.Height;
var g_textcolor = 0, g_textcolor_hl = 0;
var g_backcolor = 0;
var g_hot = false;
var timer1=0;
var time_artist=0;
var time_album=0;
var time_title=0;
var resetID=0;
var resetID2=0;
var artist_2byte_len=0;
var album_2byte_len=0;
var title_2byte_len=0;
var imgpath = fb.ProfilePath+"/import/";
var albumart = gdi.Image(imgpath+"logo.png");
var g_artist_len = 0;
var g_album_len = 0;
var g_title_len = 0;

//AlbumArt用
var x = 48;
var y = 0;
var w = 200;
var h = 200;
var src_x = 30;
var src_y = 20;
var src_w = 380;
var src_h = 380;
var angle = 0;
var alpha = 50;

//新機能
var enableClockRequest = false;
var g_enableNextTrackAbove1200 = false;//1200秒以上かどうか

get_font();
get_colors();

/*function on_playback_time(time) {
    timer1++;
    window.Repaint();
}
*/
function charcount(str) {
  len = 0;
  str = escape(str);
  for (i=0;i<str.length;i++,len++) {
    if (str.charAt(i) == "%") {
      if (str.charAt(++i) == "u") {
        i += 3;
        len++;
      }
      i++;
    }
  }
  len = str.length-len;
  return len;
}

function get_font() {
    if (g_is_default_ui) { // DUI
        g_font = window.GetFontDUI(FontTypeCUI.defaults);
    } else { // CUI
        g_artist_font = gdi.Font("NotoSansCJKjp-Regular", 13, 0);
        g_album_font = gdi.Font("NotoSansCJKjp-Regular", 13, 0);
        g_title_font = gdi.Font("NotoSansCJKjp-Regular", 16, 0);
        g_next_title_font = gdi.Font("NotoSansCJKjp-Regular", 15, 0);
    }
}

function get_colors() {
    if (g_is_default_ui) { // DUI
        g_textcolor = window.GetColorDUI(ColorTypeDUI.text);
        g_textcolor_hl = window.GetColorDUI(ColorTypeDUI.highlight);
        g_backcolor = window.GetColorDUI(ColorTypeDUI.background);
    } else { // CUI
        //g_textcolor = window.GetColorCUI(ColorTypeCUI.text);
        g_textcolor = RGBA(190,200,210,255);
        g_textcolor_hl = window.GetColourCUI(ColorTypeCUI.text);
        //g_textcolor_hl = RGBA(170,190,210,255);
        g_backcolor = RGBA(22,29,35,255);
    }
}

function AlbumArtReload(){
    
    if (fb.GetNowPlaying()){
        albumart = utils.GetAlbumArtV2(fb.GetNowPlaying());
    }
    if (albumart == null){
        albumart = gdi.Image(imgpath+"logo.png");
        x = 48;
        y = 0;
        w = 200;
        h = 200;
        src_x = 30;
        src_y = 20;
        src_w = 380;
        src_h = 380;
        angle = 0;
        alpha = 50;
    }
    else{
        var aspect_raito = (albumart.Width/albumart.Height);
        x = 0;
        y = 0;
        w = 200;
        h = 200;
        src_x = 0;
        src_y = (albumart.Width/2.6-albumart.Width/4);
        src_w = albumart.Width;
        src_h = albumart.Height * aspect_raito;
        angle = 0;
        alpha = 80;
        //albumart = ApplyBlur(albumart,50);
    }
    
}

function on_size() {
    ww = window.Width;
    wh = window.Height;
    if(ww<1900||wh<1000){
        if(fb.TitleFormat("%Always on Top%").Eval(true)){
            //fb.RunMainMenuCommand("View/Always on Top");
        }
    }
}
//var charcount = 
function reloadInfoPanel(){
    window.ClearInterval(resetID_Timeout_Artist);//インターバルリセット、これが無いと、再生毎に加速度的に速くなっていく
    window.ClearTimeout(resetID_Interval_Artist);//タイムアウトリセット、これが無いと、再生毎に加速度的に速くなっていく
    window.ClearInterval(resetID_Timeout_Album);
    window.ClearTimeout(resetID_Interval_Album);
    window.ClearInterval(resetID_Timeout_Title);
    window.ClearTimeout(resetID_Interval_Title);
    AlbumArtReload();
    g_artist = fb.TitleFormat("%Artist%").Eval();
    g_album = fb.TitleFormat("%Album%").Eval();
    g_title = fb.TitleFormat("%Title%").Eval();
    if(fb.TitleFormat("%Artist%").Eval()=="?"){
        g_artist="No Artist";
    }
    if(fb.TitleFormat("%Album%").Eval()=="?"){
        g_album="No Album";
    }
    if(fb.TitleFormat("%Title%").Eval()=="?"){
        g_album="No Title";
    }
    
    window.Repaint();
    artist_2byte_len=charcount(g_artist);
    album_2byte_len=charcount(g_album);
    title_2byte_len=charcount(g_title);
    time_artist = g_Leftflow;
    time_album = g_Leftflow;
    time_title = g_Leftflow;
    //moveArtistCharThread();
    //moveAlbumCharThread();
    //moveTitleCharThread();
}

var interval=-13;//調整用 流すときの時間間隔
var g_Leftflow = 0;
var ShadowPosition=2;
var ShadowColor = RGBA(50,50,50,100);

function on_paint(gr) {
    //背景
    gr.FillSolidRect(0, 0, ww, wh, g_backcolor);
    
    //InfoPanel描画
    printInfoPanel(gr);
    
    gr.DrawImage(albumart, x, y, w, h, src_x, src_y, src_w, src_h, angle, alpha);
    
    g_artist_len = gr.CalcTextWidth(g_artist,g_artist_font);//サイズ確認
    g_album_len = gr.CalcTextWidth(g_album,g_album_font);//サイズ確認
    g_title_len = gr.CalcTextWidth(g_title,g_title_font);//サイズ確認
    if(!fb.IsPlaying){
        printTextAndShadow(gr, g_artist, g_artist_font, g_hot ? g_textcolor_hl : g_textcolor, -g_Leftflow, InfoPanelArtistRectClass.y, InfoPanelRectClass.w, wh);
        printTextAndShadow(gr, g_album, g_album_font, g_hot ? g_textcolor_hl : g_textcolor, -g_Leftflow, InfoPanelAlbumRectClass.y, InfoPanelRectClass.w, wh);
        printTextAndShadow(gr, g_title, g_title_font, g_hot ? g_textcolor_hl : g_textcolor, -g_Leftflow, InfoPanelTitleRectClass.y, InfoPanelRectClass.w, wh);
    }
    else{
        
        var remaining_sec = fb.TitleFormat("[%_time_remaining_seconds%]").Eval(true);
        
        if(remaining_sec == "") printNothing(gr);
        else if(remaining_sec >= 30){
            printTextAndShadow(gr, g_artist, g_artist_font, g_hot ? g_textcolor_hl : g_textcolor, -g_Leftflow, InfoPanelArtistRectClass.y, InfoPanelRectClass.w, wh);
            printTextAndShadow(gr, g_album, g_album_font, g_hot ? g_textcolor_hl : g_textcolor, -g_Leftflow, InfoPanelAlbumRectClass.y, InfoPanelRectClass.w, wh);
            printTextAndShadow(gr, g_title, g_title_font, g_hot ? g_textcolor_hl : g_textcolor, -g_Leftflow, InfoPanelTitleRectClass.y, InfoPanelRectClass.w, wh);
            //printNormalMode(gr);
        }
        else printAfter30secMode(gr);
        
    }
    //Button定義
    printButton(gr);
    
    //Volume
    printVolume(gr);
    
}

function on_playback_edited(handle) {
    AlbumArtReload();
    
    window.Repaint();
    //else enableClockRequest = true;
}

/*
function on_mouse_lbtn_up(x, y) {
    window.ShowConfigure();
}


function on_mouse_move() {
    if (!g_hot) {
        g_hot = true;
        window.SetCursor(IDC_HAND);
        window.Repaint();
    }
}

function on_mouse_leave() {
    if (g_hot) {
        g_hot = false;
        window.Repaint();
    }
}

function on_font_changed() {
    get_font();
    window.Repaint();
}

function on_colors_changed() {
    get_colors();
    window.Repaint();
}
*/

var calcTextWidth = function(styledElement, value) {

        var fontProperties = ['font-style','font-weight','font-size', 'font-family'];
        var font = _.reduce(fontProperties, function(acc, prop) {
            return acc + ' ' + $(styledElement).css(prop);
        }, '').trim();

        var c = document.createElement('canvas');
        var ctx=c.getContext('2d');
        ctx.font = font;
        var measurement = ctx.measureText(value);
        return Math.round(measurement.width);
};

//アルファ(不透明度)付きRGB関数
function RGBA(r, g, b, a) {
    return ((a << 24) | (r << 16) | (g << 8) | (b));
}

////秒数から ”1wk 5d 00:29:03” のような文字列を返す。
function format_length(y) {
    var t = Math.round(y);//年
    var w = Math.floor(t / 604800);//週
    var d = Math.floor((t -= w * 604800) / 86400);//日
    var h = Math.floor((t -= d * 86400) / 3600);//時間
    var m = Math.floor((t -= h * 3600) / 60);//分
    var s = t -= m * 60;//秒
    var temp = "";
    if (w > 0){
        temp += w + "wk ";//週を追加
    }
    if (w > 0 || d > 0){
        temp += d + "d ";//日を追加
    }
    if (w > 0 || d > 0 || h > 0){
        if(h < 10){
            //10時間未満
            temp += "0" + h + ":"; //時間が1桁の時に必要
        }else{
            temp += h + ":";
        }
        temp += (h > 0 && m < 10 ? "0" + m : m) + ":";
    }else{
        //1時間以下
        temp += "00:"+ (m < 10 ? "0"+m+":" : m + ":");
    }
    temp += s < 10 ? "0" + s : s;
    return temp;
}

function BitRateColor(BitRate){
    if(BitRate > 4608){
        return RGBA(220,40,40,100);
    }
    if(BitRate > 1411){
        //CD以上
        return RGBA(210,50,100,255);
    }
    if(BitRate > 320){
        return RGBA(210,100,220,255);
    }
    if(BitRate > 256){
        return RGBA(150,130,255,255);
    }
    if(BitRate > 192){
        return RGBA(0,180,180,255);
    }
    if(BitRate > 128){
        return RGBA(170,190,210,255);
    }else{
        return RGBA(120,220,0,255);
    }
}

function Channels_Color(Channels){
    if(Channels > 8){
        //8ch(7.1ch)以上
        return RGBA(220,40,40,100);
    }
    if(Channels > 6){
        //7~8ch(7.1ch)
        return RGBA(210,50,100,255);
    }
    if(Channels > 4){
        //5~6ch(5.1ch)
        return RGBA(210,210,50,255);
    }
    if(Channels > 2){
        //3~4ch
        return RGBA(0,180,180,255);
    }
    if(Channels > 1){
        //Stereo
        return RGBA(170,190,210,255);
    }
    else{
        //Mono
        return RGBA(150,200,0,255);
    }
}

function TEMPO_Color(TEMPO){
    if(TEMPO >= 150){
        if(TEMPO >= 255){
            return RGBA(255,0,0,255);
        }else{
            var Gre=(255-TEMPO)*2;
            return RGBA(255,Gre,0,255);
        }
    }
    if(TEMPO >= 140){
        return RGBA(230,240,0,255);
    }
    if(TEMPO >= 130){
        return RGBA(210,230,0,255);
    }
    if(TEMPO >= 120){
        return RGBA(180,220,0,255);
    }
    if(TEMPO >= 110){
        return RGBA(100,200,10,255);
    }
    if(TEMPO >= 100){
        return RGBA(0,200,130,255);
    }
    if(TEMPO >= 90){
        return RGBA(0,200,160,255);
    }
    if(TEMPO >= 80){
        return RGBA(0,170,180,255);
    }
    if(TEMPO >= 70){
        return RGBA(0,130,200,255);
    }
    if(TEMPO >= 60){
        return RGBA(0,100,220,255);
    }
    else{
        //60以下
        return RGBA(0,80,225,255);
    }
}

function SampleRate_Color(SampleRate){
    if(SampleRate >= 352800){
        return RGBA(220,40,40,100);
    }
    if(SampleRate >= 176400){
        return RGBA(210,50,100,255);
    }
    if(SampleRate >= 88200){
        return RGBA(210,210,50,255);
    }
    if(SampleRate >= 48000){
        return RGBA(210,170,210,255);
    }
    if(SampleRate >= 44100){
        return RGBA(170,190,210,255);
    }
    else{
        return RGBA(150,200,0,255);
    }
}

function Codec_Color(encoding){
    if(encoding == "lossy"){
        return RGBA(170,190,210,255);
    }
    else if(encoding == "lossless"){
        return RGBA(220,120,0,255);
    }
    else{
        return RGBA(0,120,225,255);
    }
}

function BitsperSample_Color(BitsperSample){
    if(BitsperSample == 1){
        return RGBA(220,40,40,100);
    }
    if(BitsperSample >= 32){
        return RGBA(210,50,100,255);
    }
    if(BitsperSample >= 24){
        return RGBA(210,210,50,255);
    }
    if(BitsperSample >= 16){
        return RGBA(170,190,210,255);
    }
    if(BitsperSample >= ""){
        return RGBA(170,190,210,255);
    }
    else{
        return RGBA(150,200,0,255);
    }
}

function UpDown_Color(Value){
    if(Value == 0){
        //Even
        return RGBA(170,190,210,255);
    }
    else if(Value > 0){
        //High
        return RGBA(180,60,100,255);
    }
    else{
        //Low
        return RGBA(0,150,225,255);
    }
}

function VolumeColor(Volume){
    //このときVolumeは0か負の数なので注意する事
    var R,G,B,A=0;
    R=170-( (-1.7)*Math.round(Volume));
    G=190-( (-1.9)*Math.round(Volume));
    B=210-( (-1)*Math.round(Volume));
    return RGBA(R,G,B,255);
}

// Used in window.GetColorCUI()
var ColorTypeCUI = {
    text: 0,
    selection_text: 1,
    inactive_selection_text: 2,
    background: 3,
    selection_background: 4,
    inactive_selection_background: 5,
    active_item_frame: 6
};

// Used in window.GetFontCUI()
var FontTypeCUI = {
    items: 0,
    labels: 1
};

// Used in window.GetColorDUI()
var ColorTypeDUI = {
    text: 0,
    background: 1,
    highlight: 2,
    selection: 3
};

// Used in window.GetFontDUI()
var FontTypeDUI = {
    defaults: 0,
    tabs: 1,
    lists: 2,
    playlists: 3,
    statusbar: 4,
    console: 5
};

function applyBlur(image, blurValue){
    var w = image.Width;
    var h = image.Height;

    var tmp = image.Resize(w * blurValue / 100, h * blurValue / 100, 7); // 画像を縮小する
    var blurred_image = tmp.Resize(w, h, 7); // 縮小した画像を元のサイズに戻す（縮小率によって画像のblur具合が変化する）
    tmp.Dispose();
    image.Dispose();

    var newImg = gdi.CreateImage(w, h);
    var canvas = newImg.GetGraphics();
    var offset = 100 - blurValue;
    canvas.DrawImage(blurred_image, 0 - offset, 0 - offset, w + offset * 2, h + offset * 2, 0, 0, w, h, 0, 255); // 上下左右をoffsetの値分だけ引き伸ばして中央部分を切り取った形 // blurValue が小さいほど切り取る部分がより中央になる

    newImg.ReleaseGraphics(canvas);
    blurred_image.Dispose();

    return newImg;
}

function TfReload(NextTrackScan){
    //fb.Trace("TfReload");
    Elapsed=format_length(fb.TitleFormat("%_time_elapsed_seconds%").Eval(false));
    Remaining=format_length(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false));
    Total=format_length(fb.TitleFormat("%length_seconds%").Eval(false));
    SampleRate=fb.TitleFormat("[%samplerate%]").Eval(true);
    BitsperSample=fb.TitleFormat("$if([$info(bitspersample)],$info(bitspersample),16)").Eval(true);
    Channels=fb.TitleFormat("$info(channels)").Eval(true);
    BitRate=fb.TitleFormat("[%bitrate%]").Eval(true);
    Years=fb.TitleFormat("$cut([%date%],4)").Eval(true);
    Encord=fb.TitleFormat("$info(encoding)").Eval(true);
    //Bpm2=fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").Eval(true);
    if(fb.TitleFormat("%codec%").Eval(true) != "ALAC" && fb.TitleFormat("%codec%").Eval(true) != "AAC"){
        var tmp_tempo = fb.TitleFormat("%TEMPO%").Eval(true);
        if(tmp_tempo == "?"){
            Bpm = "?";
        }
        else{
            Bpm = Math.round(tmp_tempo);
        }
    }
    else{
        //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
        if(fb.TitleFormat("%TEMPO%").Eval(true) == ""){
            Bpm = "";
        }
        else if(fb.TitleFormat("%TEMPO%").Eval(true) == "00000 BPM"){
            Bpm = "0";
        }
        else{
            Bpm = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").Eval(true);
        }
    }
    Title = fb.TitleFormat("%title%").Eval(true);
    TrackNumber = fb.TitleFormat("%tracknumber%").Eval(false);
    if(TrackNumber == "?")TrackNumber="01";
    DiscNumber = fb.TitleFormat("%discnumber%").Eval(false);
    if(DiscNumber == "?")DiscNumber=1;
    Loading = false; 
    if(fb.TitleFormat("%length_seconds%").Eval(false)%2 == 0){
        TotalEven = true;
    }
    else{
        TotalEven = false;
    }
    if(NextTrackScan){
        GetNextTrack();
        GetSelectionItem();
        SubMessage = Title;
    }
}

function GetNextTrack(){
    //playback_startingでやるとオーバーフローする
    if(fb.StopAfterCurrent){
        NextMessageType = 2;
        NextTitle = "Stop Playback";
        NextTempo = 0;
    }
    else if(plman.GetPlaybackQueueContents().length !== 0){
        //Queueが存在するとき
        NextMessageType = 0;
        var NextTrack = plman.GetPlaybackQueueContents()[0].Handle;
        NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextTrack);
        if(fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "ALAC" && fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "AAC"){
            var tmp_tempo = fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack);
            if(tmp_tempo == "?"){
                NextTempo = "?";
            }
            else{
                NextTempo = Math.round(tmp_tempo);
            }
        }
        else{
            //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
            if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == ""){
                NextTempo = "";
            }
            else if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == "00000 BPM"){
                NextTempo = "0";
            }
            else{
                NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").EvalWithMetadb(NextTrack);
            }
        }
    }
    else{
        //fb.ShowPopupMessage("aaaaaa");
        switch(plman.PlaybackOrder){
            case 0:
                //Default
                var NowPlayingItemIndex = plman.GetPlayingItemLocation().PlaylistItemIndex;//現在再生している曲がプレイリストから何番か
                //fb.ShowPopupMessage(NowPlayingItemIndex);
                var NextItem = plman.GetPlaylistItems(plman.PlayingPlaylist);//現在再生中のPlaylistを検索
                //fb.ShowPopupMessage(NextHandler);
                //NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextHandler);
                if(NowPlayingItemIndex+1 == NextItem.Count){
                    NextMessageType = 1;
                    NextTitle = "Playback END.";
                    NextTempo = 0;
                    break;
                }
                else if(NowPlayingItemIndex > NextItem.Count){
                    //Error
                    NextMessageType = 4;
                    NextTitle = "Error, please give me feedback.";
                    NextTempo = 0;
                    //fb.StopAfterCurrent = true;
                    break;
                }
                else{
                    NextMessageType = 0;
                    console.log(NextItem);
                    var NextTrack = NextItem[NowPlayingItemIndex+1];
                    NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextTrack);
                    
                    if(fb.TitleFormat("%length_seconds%").EvalWithMetadb(NextTrack) >= 1200) g_enableNextTrackAbove1200 = true;
                    else g_enableNextTrackAbove1200 = false;
                    
                    if(fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "ALAC" && fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "AAC"){
                        var tmp_tempo = fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack);
                        if(tmp_tempo == "?"){
                            NextTempo = "?";
                        }
                        else{                            
                            NextTempo = Math.round(tmp_tempo);
                        }
                    }
                    else{
                        //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
                        if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == ""){
                            NextTempo = "";
                        }
                        else if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == "00000 BPM"){
                            NextTempo = "0";
                        }
                        else{
                            NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").EvalWithMetadb(NextTrack);
                        }
                    }
                }
                break;
            case 1:
                //Repeat(playlist)
                var NowPlayingItemIndex = plman.GetPlayingItemLocation().PlaylistItemIndex;//現在再生している曲がプレイリストから何番か
                //fb.ShowPopupMessage(NowPlayingItemIndex);
                var NextItem = plman.GetPlaylistItems(plman.PlayingPlaylist);//現在再生中のPlaylistを検索
                //fb.ShowPopupMessage(NextHandler);
                //NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextHandler);
                if(NowPlayingItemIndex+1==NextItem.Count){
                    NextMessageType = 0;
                    var NextTrack = NextItem.Item(0);
                    NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextTrack);
                    if(fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "ALAC" && fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "AAC"){
                        var tmp_tempo = fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack);
                        if(tmp_tempo == "?"){
                            NextTempo = "?";
                        }
                        else{                            
                            NextTempo = Math.round(tmp_tempo);
                        }
                    }
                    else{
                        //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
                        if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == ""){
                            NextTempo = "";
                        }
                        else if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == "00000 BPM"){
                            NextTempo = "0";
                        }
                        else{
                            NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").EvalWithMetadb(NextTrack);
                        }
                    }
                    break;
                }
                else if(NowPlayingItemIndex > NextItem.Count){
                    NextMessageType = 0;
                    var NextTrack = NextItem.Item(0);
                    NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextTrack);
                   
                    if(fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "ALAC" && fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "AAC"){
                        var tmp_tempo = fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack);
                        if(tmp_tempo == "?"){
                            NextTempo = "?";
                        }
                        else{                            
                            NextTempo = Math.round(tmp_tempo);
                        }
                    }
                    else{
                        //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
                        if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == ""){
                            NextTempo = "";
                        }
                        else if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == "00000 BPM"){
                            NextTempo = "0";
                        }
                        else{
                            NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").EvalWithMetadb(NextTrack);
                        }
                    }
                    break;
                }
                else{
                    NextMessageType = 0;
                    var NextTrack = NextItem.Item(NowPlayingItemIndex+1);
                    NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextTrack);
                   
                    if(fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "ALAC" && fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "AAC"){
                        var tmp_tempo = fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack);
                        if(tmp_tempo == "?"){
                            NextTempo = "?";
                        }
                        else{                            
                            NextTempo = Math.round(tmp_tempo);
                        }
                    }
                    else{
                        //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
                        if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == ""){
                            NextTempo = "";
                        }
                        else if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == "00000 BPM"){
                            NextTempo = "0";
                        }
                        else{
                            NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").EvalWithMetadb(NextTrack);
                        }
                    }
                }
                break;
            case 2:
                //Repeat (track)
                NextMessageType = 0;
                NextTitle = "Repeat"+"("+fb.TitleFormat("%title%").Eval(true)+")";
                
                if(fb.TitleFormat("%codec%").Eval(true) != "ALAC" && fb.TitleFormat("%codec%").Eval(true) != "AAC"){
                        var tmp_tempo = fb.TitleFormat("%TEMPO%").Eval(true);
                        if(tmp_tempo == "?"){
                            NextTempo = "?";
                        }
                        else{                            
                            NextTempo = Math.round(tmp_tempo);
                        }
                }
                else{
                    //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
                    if(fb.TitleFormat("%TEMPO%").Eval(true) == ""){
                        NextTempo = "";
                    }
                    else if(fb.TitleFormat("%TEMPO%").Eval(true) == "00000 BPM"){
                        NextTempo = "0";
                    }
                    else{
                        NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").Eval(true);
                    }
                }
                break;
            case 3:
                //Random
                NextMessageType = 3;
                NextTitle = "Random";
                NextTempo = 0;
                break;
            case 4:
                //Shuffle(tracks)
                NextMessageType = 3;
                NextTitle = "Shuffle";
                NextTempo = 0;
                break;
            case 5:
                //Shuffle(album)
                var NowPlayingItemIndex = plman.GetPlayingItemLocation().PlaylistItemIndex;//現在再生している曲がプレイリストから何番か
                //fb.ShowPopupMessage(NowPlayingItemIndex);
                var NextItem = plman.GetPlaylistItems(plman.PlayingPlaylist);//現在再生中のPlaylistを検索
                //fb.ShowPopupMessage(NextHandler);
                //NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextHandler);
                if(NowPlayingItemIndex+1==NextItem.Count){
                    NextMessageType = 1;
                    NextTitle = "Playback END.";
                    NextTempo = 0;
                    break;
                }
                else if(NowPlayingItemIndex > NextItem.Count){
                    //Error
                    NextMessageType = 4;
                    NextTitle = "Error, please give me feedback";
                    NextTempo = 0;
                    //fb.StopAfterCurrent = true;
                    break;
                }
                else{
                    var NextTrack = NextItem.Item(NowPlayingItemIndex+1);
                    var NextAlbum = fb.TitleFormat("%album%").EvalWithMetadb(NextTrack);
                    
                    if(fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "ALAC" && fb.TitleFormat("%codec%").EvalWithMetadb(NextTrack) != "AAC"){
                        var tmp_tempo = fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack);
                        if(tmp_tempo == "?"){
                            NextTempo = "?";
                        }
                        else{                            
                            NextTempo = Math.round(tmp_tempo);
                        }
                    }
                    else{
                        //fb.Trace(fb.TitleFormat("%TEMPO%").Eval(true));
                        if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == ""){
                            NextTempo = "";
                        }
                        else if(fb.TitleFormat("%TEMPO%").EvalWithMetadb(NextTrack) == "00000 BPM"){
                            NextTempo = "0";
                        }
                        else{
                            NextTempo = fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").EvalWithMetadb(NextTrack);
                        }
                    }
                }
                var NowAlbum = fb.TitleFormat("%album%").Eval(true);
                if(NowAlbum === NextAlbum){
                    NextMessageType = 0;
                    NextTitle = fb.TitleFormat("%title%").EvalWithMetadb(NextTrack);
                }else{
                    NextMessageType = 3;
                    NextTitle = "Shuffle"; 
                    NextTempo = 0;                   
                }
                break;
            default:
                //Shuffle(folders)
                NextMessageType = 3;
                NextTitle = "Shuffle";
                NextTempo = 0;
                break;
        }
    }
}

function GetSelectionItem(){
    SelectHandle = fb.GetFocusItem();    
}

// cmd: 0 default, 1 play, 2 next, 3 prev, 4 settrack, 5 rand, 6 resume.
function on_playback_starting(cmd, is_paused) {
    Elapsed=format_length(fb.TitleFormat("%_time_elapsed_seconds%").Eval(true));
    Remaining=format_length(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(true));
    Total=format_length(fb.TitleFormat("%length_seconds%").Eval(true));
    SampleRate=fb.TitleFormat("[%samplerate%]").Eval(true);
    BitsperSample=fb.TitleFormat("$if([$info(bitspersample)],$info(bitspersample),16)").Eval(true);
    Channels=fb.TitleFormat("$info(channels)").Eval(true);
    BitRate=fb.TitleFormat("[%bitrate%]").Eval(true);
    Years=fb.TitleFormat("$cut([%date%],4)").Eval(true);
    //Bpm=fb.TitleFormat("$div([%TEMPO%],1)").Eval(true);
    Encord=fb.TitleFormat("$info(encoding)").Eval(true);
    Initialization = false
    Loading = true;
    Stop_reason = 0;
    //fb.Trace(fb.TitleFormat("%_path%").Eval(true));
    //fb.Trace(PrevTempo);
    //fb.Trace(Bpm);
    window.Repaint();
    //else enableClockRequest = true;
}


var Coordination = 12;
var interval = 13;//調整用

function on_playback_new_track(handle) {
    window.ClearInterval(ResetID_Interval);//インターバルリセット、これが無いと、再生毎に加速度的に速くなっていく
    window.ClearTimeout(ResetID_Timeout);//タイムアウトリセット、これが無いと、再生毎に加速度的に速くなっていく
    window.ClearInterval(ResetID_2ndPage);//インターバルリセット、これが無いと、再生毎に加速度的に速くなっていく
    reloadInfoPanel();
    if(!boolRestart){
        PrevTempo = Bpm;
    }
    boolRestart = false;
    TfReload(true);
    _2ndhalf = false;
    _2ndhalf_flag = false;
    
    Title_Position = 0;
    window.Repaint();
    //else enableClockRequest = true;
    ResetID_Timeout = window.SetTimeout(
        function Interval(){
            ResetID_Interval = window.SetInterval(
                function count(){//疑似スレッド作成
                    if(Title_ww <= Title_len){
                        if(0 >= Title_len+Title_Position+interval){
                            Title_Position = MainMessageRectClass.w;    
                        }
                        else{
                            Title_Position--;
                        }
                        window.RepaintRect(MainMessageRectClass.x, MainMessageRectClass.y, MainMessageRectClass.w, MainMessageRectClass.h);
                    }
                    else{
                        window.ClearInterval(ResetID_Interval);
                    }
                }
            ,40);//0.04秒に一回カウントアップ
        }
    ,2000);
    ResetID_2ndPage = window.SetInterval(
        function changePage(){//疑似スレッド作成
            switch(PageNumber){
            case 1:
                PageNumber++;
                break;
            default:
                PageNumber = 1;
                break;
            }
        }
    ,5000);//5秒に一回変わる
    //moveArtistCharThread();
    //moveAlbumCharThread();
    //moveTitleCharThread();
}

function on_playback_time(time) {
    Elapsed=format_length(time);
    Remaining=format_length(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(true));
    Total=format_length(fb.TitleFormat("%length_seconds%").Eval(true));
    window.RepaintRect(TimeRectClass.x, TimeRectClass.y, TimeRectClass.w, TimeRectClass.h);
    window.RepaintRect(InfoPanelRectClass.x, InfoPanelRectClass.y, InfoPanelRectClass.w, InfoPanelRectClass.h);
}

function on_mouse_lbtn_up(x, y) {
    buttonLbtn_up(x,y);
}

function on_mouse_move() {
    buttonMouse_move(x,y);
    //window.RepaintRect(0, 79, 199, 25);//重いので削除
}

function on_mouse_leave() {
}

function on_font_changed() {
    get_font();
    //window.Repaint();
}

function on_colors_changed() {
    get_colors();
    //window.Repaint();
}

function on_volume_change(val) {
    volume = val;
    volume = volume.toFixed(2);
    window.RepaintRect(VolumeRectClass.x, VolumeRectClass.y, VolumeRectClass.w, VolumeRectClass.h);
}

// reason: 0 ユーザ, 1 その曲で終了, 2 他の曲が始まった。
function on_playback_stop(reason){
    //TfReload(false);//reason == 2の場合、更新されるのは次のトラックなので注意
    switch(reason){
        case 0:
            Bpm = "";//曲が止まったので初期化
            PrevTempo = "";
            boolRestart = true;
            break;
        case 1:
            Bpm = "";//曲が止まったので初期化
            PrevTempo = "";
            boolRestart = true;
            break;
        default:
            //曲は止まっていない
            //reason == 2の場合、TfReloadで更新されるのは次のトラックなので注意
            break;
    }
    window.ClearInterval(ResetID_Interval);//インターバルリセット
    window.ClearTimeout(ResetID_Timeout);//タイムアウトリセット
    Title_Position = 0;
    switch(reason){
    case 0:
        Stop_reason = 1;
        NextMessageType = 2;//0:Play, 1:Stop(自然的), 2:Stop(人為的), 3:Random or Shuffle,
        Title ="Select Music and Enjoy";
        break;
    case 1:
        Stop_reason = 1;
        NextMessageType = 1;//0:Play, 1:Stop(自然的), 2:Stop(人為的), 3:Random or Shuffle,
        Title ="Select Music and Enjoy";
        break;
    case 2:
        Stop_reason = 0;
        NextMessageType = 0;//0:Play, 1:Stop(自然的), 2:Stop(人為的), 3:Random or Shuffle,
        break;
    }
    window.Repaint();
    //else enableClockRequest = true;
}

function on_playback_dynamic_info() {
    SampleRate=fb.TitleFormat("[%samplerate%]").Eval(true);
    BitsperSample=fb.TitleFormat("$if([$info(bitspersample)],$info(bitspersample),16)").Eval(true);
    Channels=fb.TitleFormat("$info(channels)").Eval(true);
    BitRate=fb.TitleFormat("[%bitrate%]").Eval(true);
    Years=fb.TitleFormat("$cut([%date%],4)").Eval(true);
    //Bpm=fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").Eval(true);
    Encord=fb.TitleFormat("$info(encoding)").Eval(true);
    Title=fb.TitleFormat("%title%").Eval(true);
    GetNextTrack();
    window.Repaint();
}

function on_playback_dynamic_info_track() {
    TfReload(false);
    window.Repaint();
    //else enableClockRequest = true;
}

function on_playback_edited(handle) {
    TfReload(true);
    window.Repaint();
    //else enableClockRequest = true;
}

function on_playback_seek(time) {
    TfReload(false);
    if(fb.TitleFormat("%_time_elapsed_seconds%").Eval(false) >= Number(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false))+1){
            _2ndhalf = true;
        }
        else{
            _2ndhalf = false;
    }
    window.Repaint();
    //else enableClockRequest = true;
}

function on_playback_order_changed(new_order_index) {
    GetNextTrack();
    window.Repaint();
}
// playback orderが変わった時に呼ばれる。
// new_order_index:
// 0 Default
// 1 Repeat (Playlist)
// 2 Repeat (Track)
// 3 Random
// 4 Shuffle (tracks)
// 5 Shuffle (albums)
// 6 Shuffle (folders)

function on_playlist_stop_after_current_changed(state) {    
    GetNextTrack();
    window.Repaint();
    //else enableClockRequest = true;
}
// "stop after current"の有効/無効が切り替わった時に呼ばれる。
// state: "stop after current"値、 true または false.

function on_playback_queue_changed(origin) {    
    GetNextTrack();
    window.Repaint();
    //else enableClockRequest = true;
}
//playbackキューが変化した。
// origin: 0 ユーザーが追加した, 1 ユーザーが削除した, 2 playback advance

function on_playback_pause(state) {
    window.Repaint();
    //else enableClockRequest = true;
}


//print関数(on_paint()以外では使えません)

function printRemainig(gr){
    var str = fb.TitleFormat("[%_time_remaining_seconds%]").Eval(true);
    
    if(str >= 10)   printTextAndShadow(gr, str, g_system_font, g_textcolor, InfoPanelRemainingRectClass.x, InfoPanelRemainingRectClass.y, InfoPanelRemainingRectClass.w, InfoPanelRemainingRectClass.h);
    else            printTextAndShadow(gr, str, g_system_font, Red, InfoPanelRemainingRectClass.x+8, InfoPanelRemainingRectClass.y, InfoPanelRemainingRectClass.w, InfoPanelRemainingRectClass.h);
}

function printTextAndShadow(gr, str, font, color, x, y, w, h){
        //printShadow
        gr.GdiDrawText(str, font, ShadowColor, x+ShadowPosition, y+ShadowPosition, w, h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
        gr.GdiDrawText(str, font, ShadowColor, x-ShadowPosition, y-ShadowPosition, w, h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
        gr.GdiDrawText(str, font, ShadowColor, x-ShadowPosition, y+ShadowPosition, w, h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
        gr.GdiDrawText(str, font, ShadowColor, x+ShadowPosition, y-ShadowPosition, w, h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
        //printText
        gr.GdiDrawText(str, font, color, x, y, w, h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
}

function printTextAndShadow2(gr, str, font, color, x, y, w, h){
        //printShadow
        gr.GdiDrawText(str, font, ShadowColor, x+ShadowPosition, y+ShadowPosition, w, h, DT_CALCRECT | DT_NOPREFIX);
        gr.GdiDrawText(str, font, ShadowColor, x-ShadowPosition, y-ShadowPosition, w, h, DT_CALCRECT | DT_NOPREFIX);
        gr.GdiDrawText(str, font, ShadowColor, x-ShadowPosition, y+ShadowPosition, w, h, DT_CALCRECT | DT_NOPREFIX);
        gr.GdiDrawText(str, font, ShadowColor, x+ShadowPosition, y-ShadowPosition, w, h, DT_CALCRECT | DT_NOPREFIX);
        //printText
        gr.GdiDrawText(str, font, color, x, y, w, h, DT_CALCRECT | DT_NOPREFIX);
}

//通常の再生中の動作を書く
function printNormalMode(gr){
    
    //重いので削除
    /*
    printTextAndShadow2(gr, g_artist, g_artist_font, g_hot ? g_textcolor_hl : g_textcolor, -time_artist, 5, gr.CalcTextWidth(g_artist,g_artist_font), wh);
    if( g_artist_len+(artist_2byte_len*0) <= time_artist+interval){
        time_artist=-InfoPanelRectClass.w;//Windowの端っこまで追いやる
    }
    
    printTextAndShadow2(gr, g_album, g_album_font, g_hot ? g_textcolor_hl : g_textcolor, -time_album, 25, gr.CalcTextWidth(g_album,g_album_font), wh);
    if( g_album_len+(album_2byte_len*0) <= time_album+interval){
        time_album=-InfoPanelRectClass.w;//Windowの端っこまで追いやる
    }
    
    printTextAndShadow2(gr, g_title, g_title_font, g_hot ? g_textcolor_hl : g_textcolor, -time_title, 43, gr.CalcTextWidth(g_title,g_title_font), wh);
    if( g_title_len+(title_2byte_len*0) <= time_title+interval){
        time_title=-InfoPanelRectClass.w;//Windowの端っこまで追いやる
    }
    */
}

//何もしない
function printNothing(gr){
    //Nothing    
}

//曲終了30秒後(残り時間30～0)の動作を書く
function printAfter30secMode(gr){
    //残り時間の表示
    printRemainig(gr);
    
    printTextAndShadow(gr, "NowPlaying", g_system_font, RGBA(180,250,0), 0, 0, InfoPanelRectClass.w-1, 24);
    printTextAndShadow(gr, Title, g_next_title_font, g_hot ? g_textcolor_hl : g_textcolor, 0, 16, InfoPanelRectClass.w-1, wh);
    
    printTextAndShadow(gr, "Next", g_system_font, RGBA(0,210,255), 0, 39, InfoPanelRectClass.w-1, 24);
    
    switch(NextMessageType){
    case 0:
    //play
        printTextAndShadow(gr, NextTitle, g_next_title_font, g_hot ? g_textcolor_hl : g_textcolor, 0, 54, InfoPanelRectClass.w-1, wh);
        break;
    case 1:
    //Stop
        printTextAndShadow(gr, NextTitle, g_next_title_font, Red, 0, 54, InfoPanelRectClass.w-1, wh);
        break;
    case 2:
    //Stop
        printTextAndShadow(gr, NextTitle, g_next_title_font, Red, 0, 54, InfoPanelRectClass.w-1, wh);
        break;
    case 3:
    //Random
        printTextAndShadow(gr, NextTitle, g_next_title_font, Blue, 0, 54, InfoPanelRectClass.w-1, wh);
        break;
    }
    
}

function printInfoPanel(gr){
    Title_len = gr.CalcTextWidth(Title,TitleFont);
    var SubMessage_len = gr.CalcTextWidth(SubMessage,SubTitleFont);
    var Title_len_ww = gr.CalcTextWidth(Title,TitleFont);
    var Title_len_wh = gr.CalcTextHeight(Title,TitleFont);
    //gr.FillSolidRect(0, 0, ww, wh, RGBA(22,29,35,255));//背景
    
    var BackNumber_x = 310;
    if(DiscNumber <= 9){
        gr.GdiDrawText("8-88", gdi.Font("Digital", 120, 0), RGBA(31,31,37,100), BackNumber_x, 0, shift, wh,  DT_CENTER | DT_VCENTER | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
    }
    else{
        gr.GdiDrawText("88-88", gdi.Font("Digital", 120, 0), RGBA(31,31,37,100), BackNumber_x, 0, shift, wh,  DT_CENTER | DT_VCENTER | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
    }
    if(fb.TitleFormat("%_isplaying%").Eval(true) == true)gr.GdiDrawText(DiscNumber+"-"+TrackNumber, gdi.Font("Digital", 120, 0), RGBA(48,48,58,255), BackNumber_x, 0, shift, wh,  DT_CENTER | DT_VCENTER | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//tracknumber
    
    if(Loading){
        gr.GdiDrawText("Loading...", TitleFont, RGBA(210,210,210,255), MainMessageRectClass.x, MainMessageRectClass.y, MainMessageRectClass.w, MainMessageRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
    }
    else{
        gr.GdiDrawText(Title, TitleFont, RGBA(210,210,210,255), MainMessageRectClass.x+Title_Position, MainMessageRectClass.y, Title_len_ww, Title_len_wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
        gr.FillSolidRect(0, 0, MainMessageRectClass.x, wh, g_backcolor);
        gr.FillSolidRect(MainMessageRectClass.x+MainMessageRectClass.w, 0, ww-MainMessageRectClass.x+MainMessageRectClass.w, wh, g_backcolor);
    }
    
    gr.FillSolidRect(shift+Coordination, 0, ww-shift, wh, RGBA(22,29,35,255));//背景2
    //------------------------Debug用------------------------
    SampleRate=fb.TitleFormat("[%samplerate%]").Eval(true);
    BitsperSample=fb.TitleFormat("$if([$info(bitspersample)],$info(bitspersample),16)").Eval(true);
    Channels=fb.TitleFormat("$info(channels)").Eval(true);
    BitRate=fb.TitleFormat("[%bitrate%]").Eval(true);
    Years=fb.TitleFormat("$cut([%date%],4)").Eval(true);
    BPM=fb.TitleFormat("$ifequal($div([%TEMPO%],1),0,,$div([%TEMPO%],1))").Eval(true);
    Encord=fb.TitleFormat("$info(encoding)").Eval(true);
    //------------------------ここまで------------------------
    
    //number
    gr.GdiDrawText("88:88:88", gdi.Font("Digital", 65, 0), RGBA(40,40,40,100), 10+shift, 20, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
    gr.GdiDrawText("88:88:88", gdi.Font("Digital", 29, 0), RGBA(40,40,40,100), 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
    gr.GdiDrawText("88:88:88", gdi.Font("Digital", 29, 0), RGBA(40,40,40,100), 240+shift, 47, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Total
    gr.GdiDrawText("8888888", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 370+shift, 10, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//SampleRate
    gr.GdiDrawText("88", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 380+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//BitsperSample
    gr.GdiDrawText("88", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 485+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Channels
    gr.GdiDrawText("18888", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 565+shift, 10, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//BitRate
    gr.GdiDrawText("8888", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 590+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//years
    
    //text
    gr.GdiDrawText("Elapsed", gdi.Font("Let's go Digital Regular", 25, 0), RGBA(210,210,210,255), 20+shift, 5, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
    gr.GdiDrawText("Remaining", gdi.Font("Let's go Digital Regular", 25, 0), RGBA(210,210,210,255), 245+shift, 5, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaning
    gr.GdiDrawText("Total", gdi.Font("Let's go Digital Regular", 25, 0), RGBA(210,210,210,255), 280+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Total
    gr.GdiDrawText("Hz", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 545+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Hz
    gr.GdiDrawText("bit", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 432+shift, 65, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//BitsperSample
    gr.GdiDrawText("ch", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 536+shift, 65, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Channels
    if(Years == "" || Years <= "1"){
        gr.GdiDrawText("year", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 690+shift, 65, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//years
    }
    else{
        gr.GdiDrawText("years", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 690+shift, 65, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//years
    }
    gr.GdiDrawText("kbps", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 693+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//kbps
    
    //gr.GdiDrawText("ReplayGain", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(45,45,45,100), 15, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
    
    if(fb.TitleFormat("%_isplaying%").Eval(true) == true){
        //再生中のみ
        if(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(true) < 60){
            if(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(true)<10){
                gr.GdiDrawText(Elapsed, gdi.Font("Digital", 65, 0), RGBA(170,190,210,255), 238-ww+shift, 20, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
                gr.GdiDrawText(Remaining, gdi.Font("Digital", 29, 0), RGBA(190,0,0,255), 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
            }
            else{
                gr.GdiDrawText(Elapsed, gdi.Font("Digital", 65, 0), RGBA(170,190,210,255), 238-ww+shift, 20, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
                gr.GdiDrawText(Remaining, gdi.Font("Digital", 29, 0), RGBA(220,220,50,255), 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
            }
            if(TotalEven){
                if(fb.TitleFormat("%_time_elapsed_seconds%").Eval(false) == fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false)){
                    _2ndhalf_flag = true;
                }
            }
            else{
                if(fb.TitleFormat("%_time_elapsed_seconds%").Eval(false) == Number(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false))+1){
                    _2ndhalf = true;
                }
            }
        }
        else{
            if(TotalEven){
                if(fb.TitleFormat("%_time_elapsed_seconds%").Eval(false) == fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false)){
                    _2ndhalf_flag = true;
                    gr.GdiDrawText(Elapsed, gdi.Font("Digital", 65, 0), Green, 238-ww+shift, 20, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
                    gr.GdiDrawText(Remaining, gdi.Font("Digital", 29, 0), Green, 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
                }
                else{
                    gr.GdiDrawText(Elapsed, gdi.Font("Digital", 65, 0), RGBA(170,190,210,255), 238-ww+shift, 20, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
                    gr.GdiDrawText(Remaining, gdi.Font("Digital", 29, 0), RGBA(170,190,210,255), 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
                }
            }
            else{
                if(fb.TitleFormat("%_time_elapsed_seconds%").Eval(false) == Number(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false))+1){
                    _2ndhalf = true;
                    gr.GdiDrawText(Elapsed, gdi.Font("Digital", 65, 0), Green, 238-ww+shift, 20, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed
                    gr.GdiDrawText(Remaining, gdi.Font("Digital", 29, 0), Green, 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
                }
                else{
                    gr.GdiDrawText(Elapsed, gdi.Font("Digital", 65, 0), RGBA(170,190,210,255), 238-ww+shift, 20, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Elapsed                                
                    gr.GdiDrawText(Remaining, gdi.Font("Digital", 29, 0), RGBA(170,190,210,255), 240+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Remaining
                }
            }
        }
        if(fb.TitleFormat("%length_seconds%").Eval(false) >= 1200){
            gr.GdiDrawText(Total, gdi.Font("Digital", 29, 0), Cyan2, 240+shift, 47, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Total
        }
        else{
            gr.GdiDrawText(Total, gdi.Font("Digital", 29, 0), RGBA(170,190,210,255), 240+shift, 47, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Total
        }
        gr.GdiDrawText(SampleRate, gdi.Font("Digital", 50, 0), SampleRate_Color(SampleRate), 543-ww+shift, 10, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//SampleRate
        gr.GdiDrawText(BitsperSample, gdi.Font("Digital", 50, 0), BitsperSample_Color(BitsperSample), 430-ww+shift, 50, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//BitsperSample
        gr.GdiDrawText(Channels, gdi.Font("Digital", 50, 0), Channels_Color(Channels), 536-ww+shift, 50, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//Channels
        gr.GdiDrawText(BitRate, gdi.Font("Digital", 50, 0), BitRateColor(BitRate), 692-ww+shift, 10, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//bitrate
        gr.GdiDrawText(Years, gdi.Font("Digital", 50, 0), RGBA(170,190,210,255), 690-ww+shift, 50, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//years
        
        if(Bpm != "?"){
            //%Tempo%が存在する
            gr.GdiDrawText("tempo", gdi.Font("Let's go Digital Regular", 20, 0), RGBA(190,190,190,255), 740+shift, 1, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("1888", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 740+shift, 10, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//bpm
            gr.GdiDrawText("bpm", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 840+shift, 25, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText(Bpm, gdi.Font("Digital", 50, 0), TEMPO_Color(Bpm), 840-ww+shift, 10, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
        }
        else{
            gr.GdiDrawText("tempo", gdi.Font("Let's go Digital Regular", 20, 0), RGBA(190,190,190,255), 740+shift, 2, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("Not Scanned", gdi.Font("Let's go Digital Regular", 21, 0), Grey, 770+shift, 17, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("Press F4", gdi.Font("Let's go Digital Regular", 21, 0), Grey, 800+shift, 34, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
        }
        
        //Ver4.0
        switch(PageNumber){
        case 1:
        //ReplayGain
            if(fb.TitleFormat("[%replaygain_track_gain%]").Eval(true)!=""){
                gr.GdiDrawText(fb.TitleFormat("$if($or([%replaygain_album_gain%],[%replaygain_track_gain%]),replaygain)").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                gr.GdiDrawText(fb.TitleFormat("[%replaygain_track_gain%]").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 165+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            else if(fb.TitleFormat("[%replaygain_album_gain%]").Eval(true)!=""){
                gr.GdiDrawText(fb.TitleFormat("$if($or([%replaygain_album_gain%],[%replaygain_track_gain%]),replaygain)").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                gr.GdiDrawText(fb.TitleFormat("[%replaygain_album_gain%]").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 165+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            else{
                gr.GdiDrawText("Not Scanned", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(200,0,0,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                gr.GdiDrawText("Press F5", gdi.Font("Let's go Digital Regular", 25, 0), RGBA(200,0,0,250), 180+shift, 74, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            break;
        case 2:
        //DynamicRange
            if(fb.TitleFormat("[%DYNAMIC RANGE%]").Eval(true)!=""){
                gr.GdiDrawText("DYNAMIC RANGE "+fb.TitleFormat("[%DYNAMIC RANGE%]").Eval(true)+" DB", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(200,100,0,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            else{
                //case 1と同じ処理
                if(fb.TitleFormat("[%replaygain_track_gain%]").Eval(true)!=""){
                    gr.GdiDrawText(fb.TitleFormat("$if($or([%replaygain_album_gain%],[%replaygain_track_gain%]),replaygain)").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                    gr.GdiDrawText(fb.TitleFormat("[%replaygain_track_gain%]").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 165+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                }
                else if(fb.TitleFormat("[%replaygain_album_gain%]").Eval(true)!=""){
                    gr.GdiDrawText(fb.TitleFormat("$if($or([%replaygain_album_gain%],[%replaygain_track_gain%]),replaygain)").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                    gr.GdiDrawText(fb.TitleFormat("[%replaygain_album_gain%]").Eval(true)+"", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(0,100,200,250), 165+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                }
                else{
                    gr.GdiDrawText("Not Scanned", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(200,0,0,250), 15+shift, 70, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                    gr.GdiDrawText("Press F5", gdi.Font("Let's go Digital Regular", 25, 0), RGBA(200,0,0,250), 180+shift, 74, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                }
            }
            break;
        }
        
        //Ver2.0
        gr.GdiDrawText("Next:", gdi.Font("Let's go Digital Regular", 33, 0), RGBA(210,210,210,255), NextRectClass.x, NextRectClass.y, NextRectClass.w, NextRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
        
        //Ver3.0
        if(PrevTempo != "?" && PrevTempo != 0 && Bpm !="?"){
            var TempoDiff = Bpm - PrevTempo;
            if(TempoDiff == 0){
                //Display to "+"
                gr.GdiDrawText("±"+TempoDiff, gdi.Font("Digital", 30, 0), UpDown_Color(TempoDiff), 845+shift, 3, ww, wh, DT_WORDBREAK | DT_CALCRECT);
            }
            else if(TempoDiff > 0){
                //Display to "+"
                gr.GdiDrawText("+"+TempoDiff, gdi.Font("Digital", 30, 0), UpDown_Color(TempoDiff), 845+shift, 3, ww, wh, DT_WORDBREAK | DT_CALCRECT);
            }
            else{
                gr.GdiDrawText(TempoDiff, gdi.Font("Digital", 30, 0), UpDown_Color(TempoDiff), 845+shift, 3, ww, wh, DT_WORDBREAK | DT_CALCRECT);
            }
        }
        
        var NextTitle_x = 680;
        switch(NextMessageType){//0:Play, 1:Stop(自然的), 2:Stop(人為的), 3:Random or Shuffle,
        case 0: 
            //SubMessage(NextTitle)用
            if(Object.keys(plman.GetPlaybackQueueContents()).length !== 0){
                //Queue is Active
                gr.GdiDrawText(NextTitle, SubTitleFont, Orange, SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
            }
            else{
                if(g_enableNextTrackAbove1200){
                    gr.GdiDrawText(NextTitle, SubTitleFont, Cyan2, SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
                }
                else{
                    gr.GdiDrawText(NextTitle, SubTitleFont, RGBA(210,210,210,255), SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);
                }
            }
            
            //NextTempo用
            gr.GdiDrawText("next", gdi.Font("Let's go Digital Regular", 20, 0), RGBA(190,190,190,255), 740+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            if(NextTempo != "?"){
                gr.GdiDrawText("1888", gdi.Font("Digital", 50, 0), RGBA(40,40,40,100), 760+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                gr.GdiDrawText(NextTempo, gdi.Font("Digital", 50, 0), TEMPO_Color(NextTempo), 860-ww+shift, 50, ww, wh, DT_RIGHT | DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                gr.GdiDrawText("bpm", gdi.Font("Let's go Digital Regular", 30, 0), RGBA(210,210,210,255), 860+shift, 65, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            else{
                gr.GdiDrawText("Not Scanned", gdi.Font("Let's go Digital Regular", 26, 0), Grey, 770+shift, 68, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            if(Bpm != "?" && Bpm != 0 && NextTempo != "?" && NextTempo != 0){
                var TempoDiff = NextTempo - Bpm;
                if(TempoDiff == 0){
                    //Display to "+"
                    gr.GdiDrawText("±"+TempoDiff, gdi.Font("Digital", 25, 0), UpDown_Color(TempoDiff), 862+shift, 48, ww, wh, DT_WORDBREAK | DT_CALCRECT);
                }
                else if(TempoDiff > 0){
                    //Display to "+"
                    gr.GdiDrawText("+"+TempoDiff, gdi.Font("Digital", 23, 0), UpDown_Color(TempoDiff), 860+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT);
                }
                else{
                    gr.GdiDrawText(TempoDiff, gdi.Font("Digital", 23, 0), UpDown_Color(TempoDiff), 860+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT);
                }
            }
            break;
        case 1: 
            gr.GdiDrawText(NextTitle, SubTitleFont, Red, SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("codec", gdi.Font("Let's go Digital Regular", 20, 0), RGBA(190,190,190,255), 740+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//codec
            gr.GdiDrawText(fb.TitleFormat("%codec%").Eval(true), gdi.Font("Let's go Digital Regular", 50, 0), Codec_Color(fb.TitleFormat("$info(encoding)").Eval(true)+""), 790+shift, 53, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            break;
        case 2: 
            gr.GdiDrawText(NextTitle, SubTitleFont, Red, SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("codec", gdi.Font("Let's go Digital Regular", 20, 0), RGBA(190,190,190,255), 740+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//codec
            gr.GdiDrawText(fb.TitleFormat("%codec%").Eval(true), gdi.Font("Let's go Digital Regular", 50, 0), Codec_Color(fb.TitleFormat("$info(encoding)").Eval(true)+""), 790+shift, 53, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            break;
        case 3: 
            gr.GdiDrawText(NextTitle, SubTitleFont, Blue, SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("codec", gdi.Font("Let's go Digital Regular", 20, 0), RGBA(190,190,190,255), 740+shift, 50, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);//codec
            gr.GdiDrawText(fb.TitleFormat("%codec%").Eval(true), gdi.Font("Let's go Digital Regular", 50, 0), Codec_Color(fb.TitleFormat("$info(encoding)").Eval(true)+""), 790+shift, 53, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            break;
        }
        
        
        
        if(fb.IsPaused){
            gr.GdiDrawText("Pause", gdi.Font("Let's go Digital Regular", 24, 0), Orange, 165+shift, 3, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
        }
        if(_2ndhalf){
            if(!TotalEven & fb.TitleFormat("%_time_elapsed_seconds%").Eval(false) == Number(fb.TitleFormat("%playback_time_remaining_seconds%").Eval(false))+1){
                gr.GdiDrawText("Mid", gdi.Font("Let's go Digital Regular", 24, 0), Green, 120+shift, 4, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
            else{
                gr.GdiDrawText("2nd", gdi.Font("Let's go Digital Regular", 24, 0), Pink, 120+shift, 4, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }
        }
        else{
            gr.GdiDrawText("1st", gdi.Font("Let's go Digital Regular", 24, 0), Cyan, 120+shift, 4, ww, wh, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            if(_2ndhalf_flag){
                _2ndhalf = true;
            }
        }
    }
    else{
    //再生していない
        switch(Stop_reason){
        case 0: 
            gr.GdiDrawText("Next:", gdi.Font("Let's go Digital Regular", 33, 0), RGBA(210,210,210,255), NextRectClass.x, NextRectClass.y, NextRectClass.w, NextRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            gr.GdiDrawText("Please wait a second...", SubTitleFont, RGBA(210,210,210,255), SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            break;
        case 1:
            if(Initialization){
                gr.GdiDrawText(SubMessage, SubTitleFont, RGBA(210,210,210,255), SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
            }else{
                gr.GdiDrawText("Prev:", gdi.Font("Let's go Digital Regular", 33, 0), Grey, NextRectClass.x, NextRectClass.y, NextRectClass.w, NextRectClass.h, DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
                gr.GdiDrawText(SubMessage, SubTitleFont, Grey, SubMessageRectClass.x, SubMessageRectClass.y, SubMessageRectClass.w, SubMessageRectClass.h, DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX);//DT_END_ELLIPSIS = "..."の追加
            }
            break;
        }
    }
}


var volume = fb.Volume;
volume = volume.toFixed(2);
function printVolume(gr){
    if(-1*volume != 100){
        if(volume == 0){
            gr.GdiDrawText("Volume: "+ "±" +volume + " dB", gdi.Font("Let's go Digital Regular", 22, 1), VolumeColor(volume), VolumeRectClass.x, VolumeRectClass.y, VolumeRectClass.w, VolumeRectClass.h,  DT_CENTER| DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
        } else
        {
            gr.GdiDrawText("Volume: "+ volume + " dB", gdi.Font("Let's go Digital Regular", 22, 1), VolumeColor(volume), VolumeRectClass.x, VolumeRectClass.y, VolumeRectClass.w, VolumeRectClass.h,  DT_CENTER| DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);   
        }
    }else{
        //Mute
        gr.GdiDrawText("Mute", gdi.Font("Let's go Digital Regular", 22, 1), RGBA(200,55,60,255), VolumeRectClass.x, VolumeRectClass.y, VolumeRectClass.w, VolumeRectClass.h,  DT_CENTER  |  DT_WORDBREAK | DT_CALCRECT | DT_NOPREFIX);
    }
}

//文字を動かす関数
var resetID_Timeout_Artist;
var resetID_Interval_Artist;
var resetID_Timeout_Album;
var resetID_Interval_Album;
var resetID_Timeout_Title;
var resetID_Interval_Title;

function moveArtistCharThread(){
    var enableFirstLoop = true;
    var threadBlock = false;
    window.ClearInterval(resetID_Timeout_Artist);//インターバルリセット
    window.ClearTimeout(resetID_Interval_Artist);//タイムアウトリセット
    resetID_Timeout_Artist = window.SetTimeout(
        function Interval(){
            resetID_Interval_Artist = window.SetInterval(
                function count(){//疑似スレッド作成
                    if(InfoPanelRectClass.w <= g_artist_len){
                        //artistの座標を動かす
                        if(enableFirstLoop){
                            time_artist++;
                            enableFirstLoop = false;
                        }
                        if(time_artist == g_Leftflow){
                            if(time_album == g_Leftflow && time_title == g_Leftflow && !threadBlock){
                                threadBlock = true;
                                var ID = window.SetTimeout(function(){time_artist++;window.ClearTimeout(ID);},20000);
                            }
                            else{
                                //Nothing
                                //他の文字が元の場所に戻るまで待つ。
                            }
                        }
                        else{
                            threadBlock = false;
                            time_artist++;
                            window.RepaintRect(InfoPanelArtistRectClass.x, InfoPanelArtistRectClass.y, InfoPanelArtistRectClass.w, InfoPanelArtistRectClass.h);
                        }
                    }
                    else{
                        window.ClearInterval(resetID_Interval_Artist);
                    }
                }
            ,40);//0.04秒に一回カウントアップ
        }
    ,2000);
}

function moveAlbumCharThread(){
    var enableFirstLoop = true;
    var threadBlock = false;
    window.ClearInterval(resetID_Timeout_Album);//インターバルリセット
    window.ClearTimeout(resetID_Interval_Album);//タイムアウトリセット
    resetID_Timeout_Album = window.SetTimeout(
        function Interval(){
            resetID_Interval_Album = window.SetInterval(
                function count(){//疑似スレッド作成
                    if(InfoPanelRectClass.w <= g_album_len){
                        //artistの座標を動かす
                        if(enableFirstLoop){
                            time_album++;
                            enableFirstLoop = false;
                        }
                        if(time_album == g_Leftflow){
                            if(time_artist == g_Leftflow && time_title == g_Leftflow && !threadBlock){
                                threadBlock = true;
                                var ID = window.SetTimeout(function(){time_album++;window.ClearTimeout(ID);},20000);
                            }
                            else{
                                //Nothing
                                //他の文字が元の場所に戻るまで待つ。
                            }
                        }
                        else{       
                            threadBlock = false;                             
                            time_album++;
                            window.RepaintRect(InfoPanelAlbumRectClass.x, InfoPanelAlbumRectClass.y, InfoPanelAlbumRectClass.w, InfoPanelAlbumRectClass.h);
                        }
                    }
                    else{
                        window.ClearInterval(resetID_Interval_Album);
                    }
                }
            ,40);//0.04秒に一回カウントアップ
        }
    ,2000);
}

function moveTitleCharThread(){
    var enableFirstLoop = true;
    var threadBlock = false;
    window.ClearInterval(resetID_Timeout_Title);//インターバルリセット
    window.ClearTimeout(resetID_Interval_Title);//タイムアウトリセット
    resetID_Timeout_Title = window.SetTimeout(
        function Interval(){
            resetID_Interval_Title = window.SetInterval(
                function count(){//疑似スレッド作成
                    if(InfoPanelRectClass.w <= g_title_len){
                        //artistの座標を動かす
                        if(enableFirstLoop){
                            time_title++;
                            enableFirstLoop = false;
                        }
                        if(time_title == g_Leftflow){
                            if(time_artist == g_Leftflow && time_album == g_Leftflow && !threadBlock){
                                threadBlock = true;
                                var ID = window.SetTimeout(function(){time_title++;window.ClearTimeout(ID);},20000);
                            }
                            else{
                                //Nothing
                                //他の文字が元の場所に戻るまで待つ。
                            }
                        }
                        else{                       
                            threadBlock = false;                
                            time_title++;
                            window.RepaintRect(InfoPanelTitleRectClass.x, InfoPanelTitleRectClass.y, InfoPanelTitleRectClass.w, InfoPanelTitleRectClass.h);
                        }
                    }
                    else{
                        window.ClearInterval(resetID_Interval_Title);
                    }
                }
            ,40);//0.04秒に一回カウントアップ
        }
    ,2000);
}


//Button

var img_path = fb.ProfilePath+"/import/icons/";
var tooltip = window.CreateTooltip();

function button_img(normal_path,hover_path){
    this.normal = normal_path;
    this.hover = hover_path;
}

var b_img_stop = new button_img(img_path+"stop.ico",img_path+"stop.ico");//Stop
var b_img_pause = new button_img(img_path+"pause.ico",img_path+"stop.ico");//Pause
var b_img_play = new button_img(img_path+"play.ico",img_path+"stop.ico");//Play
var b_img_prev = new button_img(img_path+"prev.ico",img_path+"stop.ico");//Prev
var b_img_next = new button_img(img_path+"next.ico",img_path+"stop.ico");//Next
var b_img_random = new button_img(img_path+"question.ico",img_path+"stop.ico");//Random
var b_img_sac = new button_img(img_path+"folder.ico",img_path+"stop.ico");//SAC(Stop After Current)

var fn_stop = function fn_stop(){
    fb.Stop();
}
var fn_pause = function fn_pause(){
    fb.Pause();
}
var fn_play = function fn_play(){
    fb.Play();
}
var fn_prev = function fn_prev(){
    fb.Prev();
}
var fn_next = function fn_next(){
    fb.Next();
}
var fn_random = function fn_random(){
    fb.Random();
}
var fn_sac = function fn_sac(){
    fb.StopAfterCurrent = !fb.StopAfterCurrent;
}

var bs = new buttons();
bs.buttons.button_stop = new button(0, 79, 25, 25, b_img_stop, fn_stop, "Stop");
bs.buttons.button_pause = new button(25, 79, 25, 25, b_img_pause, fn_pause, "Pause");
bs.buttons.button_play = new button(50, 79, 25, 25, b_img_play, fn_play, "Play");
bs.buttons.button_prev = new button(75, 79, 25, 25, b_img_prev, fn_prev, "Prev");
bs.buttons.button_next = new button(100, 79, 25, 25, b_img_next, fn_next, "Next");
bs.buttons.button_random = new button(125, 79, 25, 25, b_img_random, fn_random, "Random");
bs.buttons.button_sac = new button(150, 79, 25, 25, b_img_sac, fn_sac, "Stop After Current");

//カーソルにあったボタンの座標
/*const*/ var BUTTON_SIZE_X = 25;
/*const*/ var BUTTON_SIZE_Y = 25;
var temp_button_focus_x = -BUTTON_SIZE_X;
var temp_button_focus_y = -BUTTON_SIZE_Y;

function printButton(gr){
    gr.FillSolidRect(0, 79, 199, 25, RGBA(90,90,90,155));
    //printButtonFocus(temp_button_focus_x,temp_button_focus_y,gr); //重いので削除
    bs.paint(gr);
}

function buttonLbtn_up(x,y){
    if(bs.buttons.button_stop.trace(x,y))bs.buttons.button_stop.lbtn_up(x,y);
    if(bs.buttons.button_pause.trace(x,y))bs.buttons.button_pause.lbtn_up(x,y);
    if(bs.buttons.button_play.trace(x,y))bs.buttons.button_play.lbtn_up(x,y);
    if(bs.buttons.button_prev.trace(x,y))bs.buttons.button_prev.lbtn_up(x,y);
    if(bs.buttons.button_next.trace(x,y))bs.buttons.button_next.lbtn_up(x,y);
    if(bs.buttons.button_random.trace(x,y))bs.buttons.button_random.lbtn_up(x,y);
    if(bs.buttons.button_sac.trace(x,y))bs.buttons.button_sac.lbtn_up(x,y);
}

function buttonMouse_move(x,y){
    bs.move(x,y);
    if(bs.buttons.button_stop.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_pause.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_play.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_prev.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_next.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_random.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_sac.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else if(bs.buttons.button_stop.trace(x,y)){
        temp_button_focus_x = x;
        temp_button_focus_y = y;
    }
    else{
        //カーソルがボタン上に置かれていない
        temp_button_focus_x = -BUTTON_SIZE_X;
        temp_button_focus_y = -BUTTON_SIZE_Y;
    }
}

function printButtonFocus(x,y,gr){
    gr.FillSolidRect(x, y, 25, 25, RGBA(45,45,45,255));
}