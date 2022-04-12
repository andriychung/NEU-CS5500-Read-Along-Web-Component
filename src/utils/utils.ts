import { Howl } from 'howler';
import { BehaviorSubject, Subject } from 'rxjs';


export interface Page {
  id: string,
  paragraphs: Node[],
  img?: string,
  attributes?:NamedNodeMap[]
}

export interface Alignment {
  [id: string]: [number, number];
}

/**
 * Gets XML from path
 * @param {string} path - the path to the xml file
 */
export function getXML(path: string): string {

  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", path, false);//TODO rewrite as async
  xmlhttp.addEventListener("error", function (error) {
    console.log(error);
  })
  xmlhttp.send();

  return xmlhttp.responseText;
}


/**
 * Return list of nodess from XPath
 * @param {string} xpath - the xpath to evaluate with
 * @param {Document} xml - the xml to evaluate
 */
function getNodeByXpath(xpath: string, xml: Document): Node[] {
  let xmlns = xml.lookupNamespaceURI(null);
  if (xmlns === null) {
    // console.error("Your XML file is missing an XML namespace.");
  }
  function nsResolver(prefix) {
    var ns = {
      'i': xmlns
    };
    return ns[prefix] || null;
  }

  let result_container: Node[] = []
  let results = xml.evaluate(xpath, xml, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
  let node = results.iterateNext();
  while (node) {
    result_container.push(node);
    node = results.iterateNext()
  }
  return result_container
}


/**
 * Return a zipped array of arrays
 * @param {array[]} arrays
 */
export function zip(arrays): Array<any[]> {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) { return array[i] })
  });
}

export function parseTEIString(xml: string): Page[] {
  let parser = new DOMParser();
  let xml_text = parser.parseFromString(xml, "text/xml")
  return parseTEIFromDoc(xml_text);
}
export function parseTEIFromDoc(xml_text: Document): Page[] {
  let pages = getNodeByXpath('.//div[@type="page"]', xml_text)
  let parsed_pages = pages.map((p: Element) => {
    let id = p.id;
    let img_xpath = `.//div[@id='${id}']/graphic/@url`
    let img = getNodeByXpath(img_xpath, xml_text)
    let p_xpath = `.//div[@id='${id}']/p`
    let paragraphs = getNodeByXpath(p_xpath, xml_text)
    let parsed_page = { id: id, paragraphs: paragraphs }
    if (img.length > 0) {
      parsed_page['img'] = img[0].nodeValue;
    }
    if(p.attributes)parsed_page["attributes"]=p.attributes;
    return parsed_page
  });
  return parsed_pages
}
/**
 * Return sentences from TEI xml file
 * @param {string} - the path to the TEI file
 */
export function parseTEI(path: string): Page[] { 
  return parseTEIString(getXML(path));
}



/**
 * Return useful data from SMIL xml file
 * @param {string} - the path to the SMIL file
 */
export function parseSMIL(path: string): Alignment {
  let xmlDocument = getXML(path)
  let parser = new DOMParser();
  let xml_text = parser.parseFromString(xmlDocument, "text/xml")
  let text = getNodeByXpath('/i:smil/i:body/i:par/i:text/@src', xml_text).map(x => {
    let split = x['value'].split('#');
    return split[split.length - 1]
  }
  )
  let audio_begin = getNodeByXpath('/i:smil/i:body/i:par/i:audio/@clipBegin', xml_text).map(x => x['value'] * 1000)
  let audio_end = getNodeByXpath('/i:smil/i:body/i:par/i:audio/@clipEnd', xml_text).map(x => x['value'] * 1000)
  let audio_duration = []
  for (var i = 0; i < audio_begin.length; i++) {
    let duration = audio_end[i] - audio_begin[i]
    audio_duration.push(duration)
  }
  let audio = zip([audio_begin, audio_duration])
  let result = {}
  for (var i = 0; i < text.length; i++) {
    result[text[i]] = audio[i]
  }
  return result
}

/**
 * Sprite class containing the state of our sprites to play and their progress.
 * @param {Object} options Settings to pass into and setup the sound and visuals.
 */
export var Sprite = function (options) {
  var self = this;

  self.sounds = [];
  // Setup the options to define this sprite display.
  self._sprite = options.sprite;
  // Create new Subject tracking which element is being read
  self._reading$ = new Subject;
  // List of all non-"all" sprites
  self._tinySprite = Object.keys(options.sprite).map((str) => [self._sprite[str][0], str]);
  // remove the 'all' sprite
  self._tinySprite.pop()
  // percentage finished
  self._percentPlayed = new BehaviorSubject<string>('0%');

  // Create our audio sprite definition.
  self.sound = new Howl({
    src: options.src,
    sprite: options.sprite,
    rate: options.rate
  });

  // Begin the progress step tick.
  requestAnimationFrame(self.step.bind(self));
};

Sprite.prototype = {
  /**
   * Play a sprite when clicked and track the progress.
   * @param  {String} key Key in the sprite map object.
   */
  play: function (key: string): number {
    var self = this;
    self._spriteLeft = self._tinySprite
    var sprite = key;
    // Play the sprite sound and capture the ID.
    var id = self.sound.play(sprite);
    return id
  },

  pause: function (): number {
    var self = this;
    self.sound.pause()
    return self.sound.id
  },

  /**
   * Go back s seconds, or if current position - s is less than 0
   * go back to the beginning.
   *
   * @param id - the id of the audio to roll back
   * @param s - the number of seconds to go back
   */
  goBack: function (id : number, s: number): number {
    var self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.
    if (self.sound.seek(id = id) - s > 0) {
      var id : number = self.sound.seek(self.sound.seek(id = id) - s, id);
      // move highlight back TODO: refactor out into its own function and combine with version in step()
      var seek = self.sound.seek(id = id)
      for (var j = 0; j < self._spriteLeft.length; j++) {
        // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
        if (seek * 1000 >= self._spriteLeft[j][0]) {
          self._reading$.next(self._spriteLeft[j][1])
          self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
        }
      }
      // else, return back to beginning
    } else {
      var id : number = self.sound.seek(0, id);
      self._reading$.next(self._spriteLeft[0][1])
    }
    return id
  },

  /**
 * Go back s seconds, or if current position - s is less than 0
 * go back to the beginning.
 *
 * @param id - the id of the audio to roll back
 * @param s - the number of seconds to go back
 */
  goTo: function (id : number, s : number): number {
    var self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.

    var id : number = self.sound.seek(s, id);
    // move highlight back TODO: refactor out into its own function and combine with version in step()
    var seek = self.sound.seek(id = id)
    for (var j = 0; j < self._spriteLeft.length; j++) {
      // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
      if (seek * 1000 >= self._spriteLeft[j][0]) {
        self._reading$.next(self._spriteLeft[j][1])
        self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
      }
    }
    // else, return back to beginning
    return id
  },

  /**
   * Stop the sound
   */
  stop: function (): number {
    var self = this;
    // remove reading
    self._reading$.next('')
    // Play the sprite sound and capture the ID.
    var id = self.sound.stop();
    return id
  },

  /**
   * The step called within requestAnimationFrame to update the playback positions.
   */
  step: function (): void {
    var self = this;
    // // Loop through all active sounds and update their progress bar.
    for (var i = 0; i < self.sounds.length; i++) {
      var seek = (self.sound.seek() || 0);
      for (var j = 0; j < self._spriteLeft.length; j++) { // TODO: refactor out into its own function and combine with version in step()
        // if stopped
        if (seek > 0) {
          // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
          if (seek * 1000 >= self._spriteLeft[j][0]) {
            self._reading$.next(self._spriteLeft[j][1])
            self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
          }
        }
      }
      let percent = (((seek / self.sound.duration()) * 100) || 0) + '%';
      self.sounds[i].style.width = percent;
      self.sounds[i].setAttribute("offset", percent)
    }
    requestAnimationFrame(self.step.bind(self));
  }
};


