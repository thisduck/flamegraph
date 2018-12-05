class PathCache {
  constructor() {
    this.gems = {};
    this.methods = {};
    this.files = {};
  }

  method(frame) {
    if (this.methods[frame]) {
      return this.methods[frame];
    }

    this.methods[frame] = this.extractMethod(frame);
    return this.methods[frame];
  }

  extractMethod(frame) {
    var split = frame.split('`');
    if(split.length == 2) {
      var fullMethod = split[1].split("'")[0];
      split = fullMethod.split("#");
      if(split.length == 2) {
        return split[1];
      }
      return split[0];
    }
    return '?';
  }

  gem(frame) {
    if (this.gem[frame]) {
      return this.gem[frame];
    }

    this.gem[frame] = this.extractGem(frame);
    return this.gem[frame];
  }

  extractGem(frame) {
    var split = frame.split('/lib\/ruby/');
    if (split.length > 1 && !frame.includes("/gems/")) {
      split = split[1].split("/")
      if (split.length > 1) {
        split = split[1].split(".")
        return "ruby - " + split[0];
      }
    }
    split = frame.split('/gems/');
    if(split.length == 1) {
      split = frame.split('/app/');
      if(split.length == 1) {
        split = frame.split('/lib/');
      }
      split = split[Math.max(split.length - 2, 0)].split('/');
      return split[split.length-1].split(':')[0];
    } else {
      return split[split.length -1].split('/')[0];
    }
  }

  file(frame) {
    if (this.files[frame]) {
      return this.files[frame];
    }

    this.files[frame] = this.extractFile(frame);
    return this.files[frame];
  }

  extractFile(frame) {
    var frame = this.frame;
    var split = frame.split(".rb:");
    if(split.length == 2) {
      split = split[0].split('/');
      return split[split.length - 1];
    }
    return "";
  }
}
export default (new PathCache);
