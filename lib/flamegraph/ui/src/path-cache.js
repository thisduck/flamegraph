class PathCache {
  constructor() {
    this.gems = {};
    this.shortMethods = {};
    this.fullMethods = {};
    this.files = {};
  }

  fullMethod(frame) {
    if (this.fullMethods[frame]) {
      return this.fullMethods[frame];
    }

    this.fullMethods[frame] = this.extractFullMethod(frame);
    return this.fullMethods[frame];
  }

  extractFullMethod(frame) {
    var split = frame.split('`');
    if(split.length == 2) {
      var fullMethod = split[1].split("'")[0];
      if (fullMethod.indexOf('sql_flame') < 0) {
        return fullMethod;
      }
      fullMethod = fullMethod.replace(/sql_flame_/, "SQL: ");
      return fullMethod.replace(/_a(\d+)/g, function(match, ord) {
        return String.fromCharCode(parseInt(ord, 10));
      })
    }
    return '?';
  }


  shortMethod(frame) {
    if (this.shortMethods[frame]) {
      return this.shortMethods[frame];
    }

    this.shortMethods[frame] = this.extractShortMethod(frame);
    return this.shortMethods[frame];
  }

  extractShortMethod(frame) {
    var fullMethod = this.fullMethod(frame);
    if (fullMethod.indexOf("#SQL: ")) {
      var split = fullMethod.split("#SQL: ");
      if(split.length > 1) {
        return "SQL: " + split[split.length - 1];
      }
    }
    var split = fullMethod.split(".");
    if(split.length > 1) {
      return split[split.length - 1];
    }
    split = fullMethod.split("#");
    if(split.length > 1) {
      return split[split.length - 1];
    }
    return split[0];
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
