# [![UPDATE APPARATUS](media/header.png)](https://github.com/haroldangenent/update-apparatus)

Running and testing WordPress updates is no fun. `UPDATE APPARATUS 🤖` will try and help you with this chore.

This is it's update sequence:

1. Validate dependencies
2. Crawl website
3. Update dependencies
4. Re-crawl website
5. Diff the output

![Update sequence.](media/preview.gif)

## Installation

```
npm install update-apparatus -g
```

## Usage
Run `update-apparatus` in the root of your project.
