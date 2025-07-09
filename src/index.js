import fontSizeIcon from './font-size.svg';

require('./index.css').toString();
class FontSizeTool {
  static title = 'Font Size';
  icon = fontSizeIcon;
  isDropDownOpen = false;
  togglingCallback = null;
  emptyString = '&nbsp;'; //未選択時の表示
  fontSizeDropDown = 'font-size-dropdown';

  static get sanitize() {
    return {
      font: {
        size: true,
        face: true
      },
    };
  }

  static get isInline() {
    return true;
  }

  commandName = 'fontSize';
  CSS = {
    button: 'ce-inline-tool',
    buttonActive: 'ce-font-size-tool--active',
    buttonModifier: 'ce-inline-tool--font',
  }
  nodes = {
    button: undefined
  }
  selectedFontSize = null;
  selectionList = undefined;
  buttonWrapperText = undefined;
  createSvg = undefined;
  fontSizeOptions = [];
  // defaultFontSizeOptions = [
  //   { label: '10', value: '1' },
  //   { label: '13', value: '2' },
  //   { label: '16', value: '3' },
  //   { label: '18', value: '4' },
  //   { label: '24', value: '5' },
  //   { label: '32', value: '6' },
  //   { label: '48', value: '7' }
  // ];
  defaultFontSizeOptions = ['10', '12', '14', '16', '18', '24', '32', '48'];

  constructor({config}) {
    this.fontSizeOptions = config?.fontSizeList || this.defaultFontSizeOptions;
  }

  make(tagName, classNames = null) {
    const el = document.createElement(tagName);
    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }
    return el;
  }

  createButton() {
    this.nodes.button = this.make('button', [this.CSS.button, this.CSS.buttonModifier]);
    this.nodes.button.type = 'button';
    this.nodes.button.setAttribute('id', 'fontSizeBtn');
    this.getFontSizeForButton();
  }

  getFontSizeForButton() {
    this.buttonWrapperText = this.make('div', 'button-wrapper-text');
    const displaySelectedFontSize = this.make('div');
    displaySelectedFontSize.setAttribute('id', this.fontSizeDropDown)
    displaySelectedFontSize.innerHTML = this.icon;
    this.buttonWrapperText.append(displaySelectedFontSize);
    this.nodes.button.append(this.buttonWrapperText);
  }

  addFontSizeOptions() {
    this.selectionList = this.make('div', 'selectionList');
    const selectionListWrapper = this.make('div', 'selection-list-wrapper');
    const currentFontSizeEl = document.getElementById(this.fontSizeDropDown);

    /**
     * mousedownイベントのデフォルト動作を無効にし、
     * エディタの選択範囲が解除されるのを防ぎます。
     */
    this.selectionList.addEventListener('mousedown', (event) => event.preventDefault());

    for (const fontSize of this.fontSizeOptions) {
      const option = this.make('div');
      option.setAttribute('value', fontSize);
      option.setAttribute('id', fontSize);
      option.classList.add('selection-list-option');
      if ((currentFontSizeEl && currentFontSizeEl.innerHTML === fontSize) || (this.selectedFontSize === fontSize)) {
        option.classList.add('selection-list-option-active');
      }
      option.innerHTML = fontSize;
      selectionListWrapper.append(option);
    }
    this.selectionList.append(selectionListWrapper);

    // document.bodyにリストを追加して、ボタンの外に表示します
    document.body.appendChild(this.selectionList);

    // ボタンの真下にリストを配置します
    const buttonRect = this.nodes.button.getBoundingClientRect();
    this.selectionList.style.position = 'absolute';
    this.selectionList.style.top = `${buttonRect.bottom + window.scrollY + 5}px`; // 5pxの間隔を空けます
    this.selectionList.style.left = `${buttonRect.left + window.scrollX}px`;

    this.selectionList.addEventListener('click', this.toggleFontSizeSelector);
    setTimeout(() => {
      if (typeof this.togglingCallback === 'function') {
        this.togglingCallback(true);
      }
    }, 50);
  };

  toggleFontSizeSelector = (event) => {
    this.selectedFontSize = event.target.id;
    this.toggle(); // ドロップダウンを閉じます

    if (!this.selectedFontSize) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // スタイルを適用するために新しいメソッドを呼び出します
      this.applyStyle(range);
    }
  }

  surround(range) {
    // Editor.jsがこのメソッドを呼び出すときも、同じスタイル適用ロジックを使用します
    if (!this.selectedFontSize) {
      return;
    }
    this.applyStyle(range);
  }

  applyStyle(range) {
    const selectedFontSizeOption = this.fontSizeOptions.find(
        fontSize => fontSize === this.selectedFontSize
    );

    if (selectedFontSizeOption) {
      if (range.collapsed) {
        return;
      }

      const fontSizeValue = selectedFontSizeOption;
      const lineHeightValue = Math.round(parseInt(fontSizeValue) * 1.5);

      const fontNode = document.createElement('span');
      fontNode.style.fontSize = `${fontSizeValue}px`;
      fontNode.style.lineHeight = `${lineHeightValue}px`;

      try {
        // range.extractContents() を使うことで、太字などの既存の書式を維持したままラップできます
        const selectedContent = range.extractContents();
        fontNode.appendChild(selectedContent);
        range.insertNode(fontNode);

        // ボタンに表示されているフォントサイズを更新します
        this.replaceFontSizeInWrapper(fontSizeValue);
      } catch (e) {
        console.error('フォントサイズの適用に失敗しました:', e);
      }
    }
  }

  removeFontSizeOptions() {
    if (this.selectionList) {
      this.isDropDownOpen = false;
      this.selectionList = this.selectionList.remove();
    }
    if (typeof this.togglingCallback === 'function') {
      this.togglingCallback(false);
    }
  }

  render() {
    this.createButton();
    this.nodes.button.addEventListener('click', this.toggleDropDown);
    return this.nodes.button;
  }

  toggleDropDown = ($event) => {
    if (event.target.closest('#fontSizeBtn')) {
      this.toggle((toolbarOpened) => {
        if (toolbarOpened) {
          this.isDropDownOpen = true;
        }
      });
    }
  }

  toggle(togglingCallback) {
    if (!this.isDropDownOpen && togglingCallback) {
      this.addFontSizeOptions();
    } else {
      this.removeFontSizeOptions();
    }
    if (typeof togglingCallback === 'function') {
      this.togglingCallback = togglingCallback;
    }
  }

  getComputedFontStyle(node) {
    return window.getComputedStyle(node.parentElement, null).getPropertyValue('font-size');
  };

  checkState(selection) {
    const parentSpan = selection.anchorNode.parentElement;
    let isActive = false;

    // 親要素がこのツールで作成したSPANか（font-sizeスタイルを持っているか）をチェックします
    if (parentSpan && parentSpan.tagName === 'SPAN' && parentSpan.style.fontSize) {
      const currentSize = parseInt(parentSpan.style.fontSize);
      // そのフォントサイズがオプションに存在するか確認します
      if (!isNaN(currentSize) && this.fontSizeOptions.includes(String(currentSize))) {
        // 存在すれば、ボタンの表示をその数値に更新し、アクティブ状態にします
        this.replaceFontSizeInWrapper(String(currentSize));
        isActive = true;
      } else {
        // 不明なフォントサイズの場合はアイコン表示に戻します
        this.replaceFontSizeInWrapper(this.icon);
      }
    } else {
      // スタイルが適用されていないテキストの場合はアイコン表示に戻します
      this.replaceFontSizeInWrapper(this.icon);
    }

    // ツールバーボタンのアクティブ状態を返します
    return isActive;
  }

  replaceFontSizeInWrapper(size) {
    const displaySelectedFontSize = document.getElementById(this.fontSizeDropDown);
    if (displaySelectedFontSize) {
      displaySelectedFontSize.innerHTML = size;
    }
  }

  clear() {
    this.toggle();
    this.selectedFontSize = null;
    // ツールをクリアした際は、表示をアイコンに戻します
    this.replaceFontSizeInWrapper(this.icon);
  }
}
export default FontSizeTool;
