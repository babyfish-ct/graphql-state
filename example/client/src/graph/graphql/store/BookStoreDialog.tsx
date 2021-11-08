import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { book$, bookStore$$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { BookStoreInput } from "../../__generated_graphql_schema__/inputs";
import { BookMultiSelect } from "../book/BookMultiSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";
import { useMutation } from "graphql-state";
import { useTypedStateManager } from "../../__generated_graphql_schema__";

const BOOK_STORE_EDIT_INFO =
    bookStore$$
    .books(
        book$.id
    );

export const BookStoreDialog: FC<{
    value?: ModelType<typeof BOOK_STORE_EDIT_INFO>,
    onClose: () => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookStoreInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books.map(book => book.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeBookStore(BOOK_STORE_EDIT_INFO),
        {
            onSuccess: data => {
                stateManager.save(BOOK_STORE_EDIT_INFO, data.mergeBookStore)
            }
        }
    );

    const onOk = useCallback(async () => {
        const input = await form.validateFields();
        await mutate({input});
        onClose();
    }, [form, mutate, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal 
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} BookStore`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}
        okButtonProps={{loading}}>
            <Form form={form} labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                {NAME_DESCRIPTION_ITEM}
                <Form.Item label="Books" name="bookIds">
                    <BookMultiSelect/>
                </Form.Item>
                {BOOKS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});

const FOR_NEW_NAME = `
for (const parameterizedStores of 
    cache.get(Query.findBookStores({...}))
) {
    // user optimizer or default optimizer
    const optimizer = assocaitionProperties["Query.findBookStores"];

    const dependencies = optimizer.dependencies(
        parameterizedStores.variables
    );

    if (dependencies === undefined || dependencies.has("name)) {
        const contains = optimizer.contains(this with newName);
        if (contains === true) {
            parameterizedStores.addIfAbsent(this);
        } else (contains === false) {
            parameterizedStores.removeIfExists(this);
        } else {
            cache.evict(parameterizedStores);
            // Affected UI will reload data from server later
        }
    }
}
`;

const NAME_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'BookStore.name'">
                <div className={INFORMATION_CLASS}>
                    If you change this scalar field "BookStore.name" by any of the following ways
                    <ul>
                        <li>insert: undefined -&gt; newName</li>
                        <li>update: oldName -&gt; newName</li>
                    </ul>
                    (delete will be handed by other rules)
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_NEW_NAME}</pre>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const FOR_REMOVED_BOOK = `

// Remove it from other similar assocaitons with parameters
for (const parameterizedBooks of cache.get(this.books({...}))) {
    parameterizedBooks.remove(removedBook);
}

// Change opposite endpoint if it's cached
if (cached(removedBook.store)) {
    removedBook.store = undefined;
}
`;

const FOR_ADDED_BOOK = `

// Add it into similar assocaitons with parameters
for (const parameterizedBooks of cache.get(this.books({...}))) {

    // user optimizer or default optimizer
    const optimizer = assocaitionProperties["BookStore.books"];

    const contains = optimizer.contains(
        parameterizedBooks.variables, 
        addedBook
    );
    if (contains === true) {
        parameterizedBooks.insert(..., addedBook);
    } else if (contains === false) {
        // do nothing
    } else {
        cahce.evict(parameterizedBooks);
        // Affected UI will reload data from server later
    }
}

if (cached(addedBook.store)) {
    // Change opposite endpoint if it's cached
    addBook.store = this;
} else {
    // Remove it from assocaitions of any other BookStore
    for (const otherStore of cache.bookStores) {
        if (otherStore !== this) {
            if (cached(otherStore.books({...}))) {
                otherStore.books({...}).remove(addedBook);
            }
        }
    }
}
`;

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'BookStore.books'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "BookStore.books"
                    <ul>
                        <li>
                            For each removed book, this action will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_BOOK}</pre>
                        </li>
                        <li>
                            For each added book, this action will be executed automatically
                            <pre  className={PSEUDO_CODE_CLASS}>{FOR_ADDED_BOOK}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);
