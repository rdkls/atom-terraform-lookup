'use babel';

import { CompositeDisposable } from 'atom';
import open from 'open';

const TERRAFORM_DOCS_URL = "https://www.terraform.io/docs/providers/";

const VALID_BLOCK_TYPES = [
  "data",
  "resource"
]

export default {

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'terraform-lookup:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return;
  },

  toggle() {
    // get active text editor
    const editor = atom.workspace.getActiveTextEditor();

    // get cursor buffer position
    const point = editor.getCursorBufferPosition();

    // get the line text for the cursor position
    const line = editor.lineTextForBufferRow(point.row);

    // split the line of text by spaces
    const split_line = line.split(' ');

    // extract block type from the first item in array
    const block_type = split_line[0];

    // check if block type is in valid block types
    if(VALID_BLOCK_TYPES.includes(block_type)) {
      // remove all double quotes and split the string by underscores
      const first_block_label = split_line[1].replace(/"/g, '').split('_');

      // extract our provider value from the first item in array
      const provider = first_block_label[0];

      // extract our item from the rest of the values in the array
      const item = first_block_label.slice(1).join('_');

      // assemble our url from our block type, provider, and item
      const url = (TERRAFORM_DOCS_URL + `${provider}/${block_type.charAt(0)}/${item}.html`);

      const request = new XMLHttpRequest();

      request.open('GET', url, true)

      request.onreadystatechange = () => {
        if(request.readyState === 4) {
          if (request.status === 200) {
            (async () => {
                await open(url);
            })();
          } else if (request.status === 404) {
            atom.notifications.addError('Terraform Lookup: Couldn\'t find requested resource on Terraform Docs. The provider may not be supported yet.');
          }
        }
      }

      request.onerror = () => {
        atom.notifications.addError('Terraform Lookup: Network Error');
      }

      request.send(null);

    } else {
      atom.notifications.addError('Terraform Lookup: Invalid Block Type');
    }
  }
};
